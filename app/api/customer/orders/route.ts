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

    const body =
      await request.json();

    const action =
      body?.action;

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
        return NextResponse.json(
          {
            error:
              "رقم الطلب غير صالح.",
          },
          {
            status: 400,
          }
        );
      }

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
          .in(
            "status",
            [
              "جديد",
              "pending",
            ]
          )
          .select(
            "id,status"
          )
          .maybeSingle();

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

      if (!data) {
        return NextResponse.json(
          {
            error:
              "لا يمكن إلغاء هذا الطلب الآن، ربما تم تغيير حالته بالفعل.",
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json({
        success:
          true,
        order:
          data,
      });
    }

    // =====================================================
    // الرد على تعديل الكمية
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

      // =====================================================
      // التأكد أن الطلب يخص المستخدم
      // =====================================================

      const {
        data: order,
        error:
          orderError,
      } =
        await supabase
          .from("orders")
          .select(
            "id,user_id"
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

      // =====================================================
      // الحصول على التعديل الحالي
      // =====================================================

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

      // =====================================================
      // تحديث عنصر الطلب
      // =====================================================

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

      // =====================================================
      // تحديث سجل تعديل الكمية
      // =====================================================

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

      // =====================================================
      // إعادة حساب إجمالي الطلب
      // =====================================================

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

      // =====================================================
      // إشعار الأدمن
      // =====================================================

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

    return NextResponse.json(
      {
        error:
          "Action غير معروف.",
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