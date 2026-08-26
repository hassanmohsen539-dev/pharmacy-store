import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// اختبار API مباشرة
// =====================================================

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Customer orders API is working",
  });
}

// =====================================================
// API طلبات العميل
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // الحصول على Access Token
    // =====================================================

    const authorization =
      request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          error:
            "لم يتم إرسال جلسة تسجيل الدخول.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.replace(
        /^Bearer\s+/i,
        ""
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "جلسة تسجيل الدخول غير صالحة.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // إنشاء Supabase Client
    // =====================================================

    const supabase =
      createClient(
        supabaseUrl,
        supabaseKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );

    // =====================================================
    // التأكد من المستخدم
    // =====================================================

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // قراءة Body
    // =====================================================

    const body =
      await request.json();

    const action =
      body?.action;

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "========================================"
    );

    console.log(
      "CUSTOMER ORDERS ACTION RECEIVED:",
      JSON.stringify(action)
    );

    console.log(
      "CUSTOMER ORDERS BODY:",
      body
    );

    console.log(
      "CUSTOMER ORDERS USER:",
      user.id
    );

    console.log(
      "========================================"
    );

    // =====================================================
    // تحميل كل بيانات الطلبات
    // =====================================================

    if (
      action ===
      "load_all"
    ) {
      const {
        data: orders,
        error: ordersError,
      } =
        await supabase
          .from("orders")
          .select(
            "id, user_id, customer_name, phone, address, notes, total, status, created_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        ordersError
      ) {
        return NextResponse.json(
          {
            error:
              ordersError.message,
          },
          {
            status: 500,
          }
        );
      }

      const orderIds =
        (
          orders ||
          []
        ).map(
          (order) =>
            order.id
        );

      // =====================================================
      // منتجات الطلبات
      // =====================================================

      const orderItems: Record<
        number,
        unknown[]
      > = {};

      if (
        orderIds.length >
        0
      ) {
        const {
          data: items,
          error: itemsError,
        } =
          await supabase
            .from(
              "order_items"
            )
            .select(
              "id, order_id, product_id, product_name, price, requested_quantity, approved_quantity, quantity, customer_approval, approval_message"
            )
            .in(
              "order_id",
              orderIds
            )
            .order(
              "id",
              {
                ascending:
                  true,
              }
            );

        if (
          itemsError
        ) {
          return NextResponse.json(
            {
              error:
                itemsError.message,
            },
            {
              status: 500,
            }
          );
        }

        for (
          const item of
            items || []
        ) {
          if (
            !orderItems[
              item.order_id
            ]
          ) {
            orderItems[
              item.order_id
            ] = [];
          }

          orderItems[
            item.order_id
          ].push(item);
        }
      }

      // =====================================================
      // تغييرات الكميات
      // =====================================================

      let quantityChanges:
        unknown[] = [];

      if (
        orderIds.length >
        0
      ) {
        const {
          data: changes,
          error:
            changesError,
        } =
          await supabase
            .from(
              "order_quantity_changes"
            )
            .select("*")
            .in(
              "order_id",
              orderIds
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          changesError
        ) {
          return NextResponse.json(
            {
              error:
                changesError.message,
            },
            {
              status: 500,
            }
          );
        }

        quantityChanges =
          changes ||
          [];
      }

      // =====================================================
      // الإشعارات
      // =====================================================

      const {
        data: notifications,
        error:
          notificationsError,
      } =
        await supabase
          .from(
            "notifications"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .in(
            "type",
            [
              "order_status",
              "quantity_change",
            ]
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        notificationsError
      ) {
        return NextResponse.json(
          {
            error:
              notificationsError.message,
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        orders:
          orders || [],
        orderItems,
        quantityChanges,
        notifications:
          notifications ||
          [],
      });
    }

    // =====================================================
    // تعديل كمية الطلب مباشرة بواسطة العميل
    // =====================================================

    if (
      action ===
      "update_order_item_quantity"
    ) {
      console.log(
        "UPDATE ORDER ITEM QUANTITY ACTION STARTED"
      );

      const orderId =
        Number(
          body?.orderId
        );

      const orderItemId =
        Number(
          body?.orderItemId
        );

      const productId =
        Number(
          body?.productId
        );

      const newQuantity =
        Number(
          body?.quantity
        );

      if (
        !orderId ||
        Number.isNaN(
          orderId
        ) ||
        !orderItemId ||
        Number.isNaN(
          orderItemId
        ) ||
        !productId ||
        Number.isNaN(
          productId
        ) ||
        !Number.isInteger(
          newQuantity
        ) ||
        newQuantity < 1
      ) {
        return NextResponse.json(
          {
            error:
              "بيانات تعديل الكمية غير صحيحة.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: order,
        error:
          orderError,
      } =
        await supabase
          .from("orders")
          .select(
            "id,user_id,status"
          )
          .eq(
            "id",
            orderId
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (
        orderError
      ) {
        return NextResponse.json(
          {
            error:
              orderError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (!order) {
        return NextResponse.json(
          {
            error:
              "الطلب غير موجود أو لا يخص هذا الحساب.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        order.status !==
        "جديد"
      ) {
        return NextResponse.json(
          {
            error:
              'لا يمكن تعديل الكمية إلا عندما تكون حالة الطلب "جديد".',
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: pendingChange,
        error:
          pendingChangeError,
      } =
        await supabase
          .from(
            "order_quantity_changes"
          )
          .select("id")
          .eq(
            "order_item_id",
            orderItemId
          )
          .eq(
            "order_id",
            orderId
          )
          .eq(
            "status",
            "pending"
          )
          .maybeSingle();

      if (
        pendingChangeError
      ) {
        return NextResponse.json(
          {
            error:
              pendingChangeError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (
        pendingChange
      ) {
        return NextResponse.json(
          {
            error:
              "يوجد اقتراح كمية من الأدمن في انتظار الموافقة. تعامل معه أولًا.",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data: orderItem,
        error:
          orderItemError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .select(
            "id,order_id,product_id,price,quantity"
          )
          .eq(
            "id",
            orderItemId
          )
          .eq(
            "order_id",
            orderId
          )
          .maybeSingle();

      if (
        orderItemError
      ) {
        return NextResponse.json(
          {
            error:
              orderItemError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (!orderItem) {
        return NextResponse.json(
          {
            error:
              "المنتج غير موجود داخل هذا الطلب.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        Number(
          orderItem.product_id
        ) !==
        productId
      ) {
        return NextResponse.json(
          {
            error:
              "بيانات المنتج غير متطابقة.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: product,
        error:
          productError,
      } =
        await supabase
          .from("products")
          .select(
            "id,stock"
          )
          .eq(
            "id",
            productId
          )
          .maybeSingle();

      if (
        productError
      ) {
        return NextResponse.json(
          {
            error:
              productError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (!product) {
        return NextResponse.json(
          {
            error:
              "المنتج غير موجود.",
          },
          {
            status: 404,
          }
        );
      }

      const currentStock =
        Number(
          product.stock
        );

      if (
        newQuantity >
        currentStock
      ) {
        return NextResponse.json(
          {
            error:
              `الكمية المطلوبة أكبر من المخزون الحالي. المتاح: ${currentStock}.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        newQuantity ===
        Number(
          orderItem.quantity
        )
      ) {
        return NextResponse.json({
          success:
            true,
          quantity:
            newQuantity,
          message:
            "الكمية بالفعل مساوية للقيمة الحالية.",
        });
      }

      const {
        error:
          updateItemError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .update({
            quantity:
              newQuantity,
            approved_quantity:
              newQuantity,
            customer_approval:
              null,
            approval_message:
              "تم تعديل الكمية مباشرة بواسطة العميل أثناء كون الطلب جديدًا.",
          })
          .eq(
            "id",
            orderItemId
          )
          .eq(
            "order_id",
            orderId
          );

      if (
        updateItemError
      ) {
        return NextResponse.json(
          {
            error:
              updateItemError.message,
          },
          {
            status: 500,
          }
        );
      }

      const {
        data: allItems,
        error:
          allItemsError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .select(
            "price,quantity"
          )
          .eq(
            "order_id",
            orderId
          );

      if (
        allItemsError
      ) {
        return NextResponse.json(
          {
            error:
              allItemsError.message,
          },
          {
            status: 500,
          }
        );
      }

      const newTotal =
        (
          allItems ||
          []
        ).reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.price
            ) *
              Number(
                item.quantity
              ),
          0
        );

      const {
        error:
          totalError,
      } =
        await supabase
          .from("orders")
          .update({
            total:
              newTotal,
          })
          .eq(
            "id",
            orderId
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "status",
            "جديد"
          );

      if (
        totalError
      ) {
        return NextResponse.json(
          {
            error:
              totalError.message,
          },
          {
            status: 500,
          }
        );
      }

      try {
        const {
          error:
            adminNotificationError,
        } =
          await supabase.rpc(
            "notify_admin_quantity_response",
            {
              p_admin_user_id:
                null,
              p_order_id:
                orderId,
              p_order_item_id:
                orderItemId,
              p_approved:
                true,
              p_old_quantity:
                Number(
                  orderItem.quantity
                ),
              p_new_quantity:
                newQuantity,
            }
          );

        if (
          adminNotificationError
        ) {
          console.error(
            "CUSTOMER DIRECT QUANTITY ADMIN NOTIFICATION ERROR:",
            adminNotificationError
          );
        }
      } catch (error) {
        console.error(
          "CUSTOMER DIRECT QUANTITY NOTIFICATION EXCEPTION:",
          error
        );
      }

      return NextResponse.json({
        success:
          true,
        quantity:
          newQuantity,
        total:
          newTotal,
      });
    }

    // =====================================================
    // إلغاء الطلب
    // =====================================================

    if (
      action ===
      "cancel_order"
    ) {
      const orderId =
        Number(
          body?.orderId
        );

      if (
        !orderId ||
        Number.isNaN(
          orderId
        )
      ) {
        return NextResponse.json({
          success:
            false,
          message:
            "رقم الطلب غير صالح.",
        });
      }

      // =====================================================
      // قراءة الطلب أولًا
      // =====================================================

      const {
        data: currentOrder,
        error:
          currentOrderError,
      } =
        await supabase
          .from("orders")
          .select(
            "id,user_id,status"
          )
          .eq(
            "id",
            orderId
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (
        currentOrderError
      ) {
        console.error(
          "CANCEL ORDER LOAD ERROR:",
          currentOrderError
        );

        return NextResponse.json({
          success:
            false,
          message:
            "حدث خطأ أثناء التحقق من الطلب.",
        });
      }

      if (!currentOrder) {
        return NextResponse.json({
          success:
            false,
          message:
            "الطلب غير موجود أو لا يخص حسابك.",
        });
      }

      // =====================================================
      // التحقق من الحالة
      // =====================================================

      if (
        currentOrder.status !==
          "جديد" &&
        currentOrder.status !==
          "pending"
      ) {
        return NextResponse.json({
          success:
            false,
          message:
            `لا يمكن إلغاء الطلب الآن لأن حالته الحالية هي "${currentOrder.status}".`,
          status:
            currentOrder.status,
        });
      }

      // =====================================================
      // تنفيذ الإلغاء
      // =====================================================

      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .update({
            status:
              "ملغي",
          })
          .eq(
            "id",
            orderId
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "status",
            currentOrder.status
          )
          .select(
            "id,status"
          )
          .maybeSingle();

      if (error) {
        console.error(
          "CANCEL ORDER UPDATE ERROR:",
          error
        );

        return NextResponse.json({
          success:
            false,
          message:
            "حدث خطأ أثناء إلغاء الطلب. حاول مرة أخرى.",
        });
      }

      if (!data) {
        return NextResponse.json({
          success:
            false,
          message:
            "تعذر إلغاء الطلب لأن حالته تغيرت بالفعل.",
        });
      }

      return NextResponse.json({
        success:
          true,
        message:
          "تم إلغاء الطلب بنجاح ✅",
        order:
          data,
      });
    }

    // =====================================================
    // الرد على تعديل الكمية من الأدمن
    // =====================================================

    if (
      action ===
      "respond_quantity_change"
    ) {
      const changeId =
        Number(
          body?.changeId
        );

      const orderId =
        Number(
          body?.orderId
        );

      const orderItemId =
        Number(
          body?.orderItemId
        );

      const approved =
        Boolean(
          body?.approved
        );

      if (
        !changeId ||
        !orderId ||
        !orderItemId
      ) {
        return NextResponse.json(
          {
            error:
              "بيانات تعديل الكمية غير صحيحة.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: order,
        error:
          orderError,
      } =
        await supabase
          .from("orders")
          .select(
            "id,user_id,status"
          )
          .eq(
            "id",
            orderId
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (
        orderError ||
        !order
      ) {
        return NextResponse.json(
          {
            error:
              "لا يمكن تنفيذ هذا التعديل.",
          },
          {
            status: 403,
          }
        );
      }

      const {
        data: currentChange,
        error:
          currentChangeError,
      } =
        await supabase
          .from(
            "order_quantity_changes"
          )
          .select("*")
          .eq(
            "id",
            changeId
          )
          .eq(
            "order_id",
            orderId
          )
          .eq(
            "order_item_id",
            orderItemId
          )
          .eq(
            "status",
            "pending"
          )
          .maybeSingle();

      if (
        currentChangeError
      ) {
        return NextResponse.json(
          {
            error:
              currentChangeError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (
        !currentChange
      ) {
        return NextResponse.json(
          {
            error:
              "هذا التعديل تم التعامل معه بالفعل.",
          },
          {
            status: 409,
          }
        );
      }

      const finalQuantity =
        approved
          ? currentChange.new_quantity
          : currentChange.old_quantity;

      const newStatus =
        approved
          ? "approved"
          : "rejected";

      const approvalMessage =
        approved
          ? `وافق العميل على تعديل الكمية إلى ${currentChange.new_quantity}.`
          : `رفض العميل تعديل الكمية، وتم الاحتفاظ بالكمية الأصلية ${currentChange.old_quantity}.`;

      const {
        error:
          itemError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .update({
            quantity:
              finalQuantity,
            approved_quantity:
              finalQuantity,
            customer_approval:
              newStatus,
            approval_message:
              approvalMessage,
          })
          .eq(
            "id",
            orderItemId
          )
          .eq(
            "order_id",
            orderId
          );

      if (
        itemError
      ) {
        return NextResponse.json(
          {
            error:
              itemError.message,
          },
          {
            status: 500,
          }
        );
      }

      const responseTime =
        new Date().toISOString();

      const {
        error:
          changeError,
      } =
        await supabase
          .from(
            "order_quantity_changes"
          )
          .update({
            status:
              newStatus,
            customer_response_at:
              responseTime,
          })
          .eq(
            "id",
            changeId
          )
          .eq(
            "status",
            "pending"
          );

      if (
        changeError
      ) {
        return NextResponse.json(
          {
            error:
              changeError.message,
          },
          {
            status: 500,
          }
        );
      }

      const {
        data: allItems,
        error:
          allItemsError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .select(
            "price,quantity"
          )
          .eq(
            "order_id",
            orderId
          );

      if (
        allItemsError
      ) {
        return NextResponse.json(
          {
            error:
              allItemsError.message,
          },
          {
            status: 500,
          }
        );
      }

      const newTotal =
        (
          allItems ||
          []
        ).reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.price
            ) *
              Number(
                item.quantity
              ),
          0
        );

      const {
        error:
          totalError,
      } =
        await supabase
          .from("orders")
          .update({
            total:
              newTotal,
          })
          .eq(
            "id",
            orderId
          )
          .eq(
            "user_id",
            user.id
          );

      if (
        totalError
      ) {
        return NextResponse.json(
          {
            error:
              totalError.message,
          },
          {
            status: 500,
          }
        );
      }

      const ADMIN_USER_ID =
        "6b8e2f5d-0678-444f-994c-20f9a779a506";

      const {
        error:
          notificationError,
      } =
        await supabase.rpc(
          "notify_admin_quantity_response",
          {
            p_admin_user_id:
              ADMIN_USER_ID,
            p_order_id:
              orderId,
            p_order_item_id:
              orderItemId,
            p_approved:
              approved,
            p_old_quantity:
              currentChange.old_quantity,
            p_new_quantity:
              currentChange.new_quantity,
          }
        );

      if (
        notificationError
      ) {
        console.error(
          "ADMIN NOTIFICATION ERROR:",
          notificationError
        );
      }

      return NextResponse.json({
        success:
          true,
        status:
          newStatus,
        quantity:
          finalQuantity,
        total:
          newTotal,
      });
    }

    // =====================================================
    // تعليم الإشعار كمقروء
    // =====================================================

    if (
      action ===
      "mark_notification_read"
    ) {
      const notificationId =
        Number(
          body?.notificationId
        );

      if (
        !notificationId ||
        Number.isNaN(
          notificationId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "رقم الإشعار غير صالح.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            "notifications"
          )
          .update({
            is_read:
              true,
          })
          .eq(
            "id",
            notificationId
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success:
          true,
      });
    }

    // =====================================================
    // Action غير معروف
    // =====================================================

    console.error(
      "UNKNOWN CUSTOMER ACTION:",
      JSON.stringify(action)
    );

    return NextResponse.json(
      {
        error:
          `Action غير معروف: ${JSON.stringify(action)}`,
        receivedAction:
          action,
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "CUSTOMER ORDERS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع في الخادم.",
      },
      {
        status: 500,
      }
    );
  }
}