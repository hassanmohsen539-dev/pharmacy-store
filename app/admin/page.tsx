"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  price: number;
  requested_quantity: number;
  approved_quantity: number;
  quantity: number;
  customer_approval: string | null;
  approval_message: string | null;
};

type Order = {
  id: number;
  user_id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  total: number;
  status: string;
  created_at: string;
  stock_deducted: boolean;
};

type QuantityChange = {
  id: number;
  order_id: number;
  order_item_id: number;
  old_quantity: number;
  new_quantity: number;
  status: string;
  created_at: string;
  customer_response_at: string | null;
};

type Notification = {
  id: number;
  user_id: string;
  order_id: number | null;
  order_item_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Product = {
  id: number;
  name_ar: string;
  name_en: string | null;
  image_url: string | null;
  stock: number;
};

const statusOptions = [
  { value: "جديد", label: "جديد" },
  { value: "قيد التجهيز", label: "قيد التجهيز" },
  { value: "تم الشحن", label: "تم الشحن" },
  { value: "تم التسليم", label: "تم التسليم" },
  { value: "ملغي", label: "ملغي" },
];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [orderItems, setOrderItems] = useState<
    Record<number, OrderItem[]>
  >({});

  const [products, setProducts] = useState<
    Record<number, Product>
  >({});

  const [quantityValues, setQuantityValues] =
    useState<Record<number, number>>({});

  const [originalQuantityValues, setOriginalQuantityValues] =
    useState<Record<number, number>>({});

  const [draftStatuses, setDraftStatuses] =
    useState<Record<number, string>>({});

  const [quantityChanges, setQuantityChanges] =
    useState<QuantityChange[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [savingOrderId, setSavingOrderId] =
    useState<number | null>(null);

  const [stockUpdatingId, setStockUpdatingId] =
    useState<number | null>(null);

  // =====================================================
  // تحديد الحالات التي يكون فيها المخزون مخصومًا
  // =====================================================

  function shouldHaveStockDeducted(status: string) {
    return (
      status !== "جديد" &&
      status !== "ملغي"
    );
  }

  // =====================================================
  // تحميل المنتجات
  // =====================================================

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name_ar,name_en,image_url,stock"
      );

    if (error) {
      console.error(
        "LOAD PRODUCTS ERROR MESSAGE:",
        error.message
      );

      console.error(
        "LOAD PRODUCTS ERROR DETAILS:",
        error.details
      );

      console.error(
        "LOAD PRODUCTS ERROR HINT:",
        error.hint
      );

      return;
    }

    const productMap: Record<number, Product> = {};

    (data || []).forEach((product) => {
      const p = product as Product;

      productMap[p.id] = p;
    });

    setProducts(productMap);
  }

  // =====================================================
  // تحميل تعديلات الكميات
  // =====================================================

  async function loadQuantityChanges() {
    const { data, error } = await supabase
      .from("order_quantity_changes")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "LOAD QUANTITY CHANGES ERROR:",
        error
      );

      return;
    }

    setQuantityChanges(
      (data || []) as QuantityChange[]
    );
  }

  // =====================================================
  // تحميل إشعارات الأدمن
  // =====================================================

  async function loadAdminNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "LOAD ADMIN NOTIFICATIONS ERROR:",
        error
      );

      return;
    }

    setNotifications(
      (data || []) as Notification[]
    );
  }

  // =====================================================
  // تحميل الطلبات
  // =====================================================

  async function loadOrders() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profileError ||
        !profile ||
        profile.role !== "admin"
      ) {
        setAllowed(false);
        return;
      }

      setAllowed(true);

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "LOAD ORDERS ERROR:",
          error
        );

        alert(
          "خطأ في جلب الطلبات:\n" +
            error.message
        );

        setOrders([]);
        return;
      }

      const loadedOrders =
        (data || []) as Order[];

      setOrders(loadedOrders);

      const initialStatuses: Record<
        number,
        string
      > = {};

      loadedOrders.forEach((order) => {
        initialStatuses[order.id] =
          order.status;
      });

      setDraftStatuses(
        initialStatuses
      );

      // =====================================================
      // تحميل منتجات الطلبات
      // =====================================================

      if (loadedOrders.length > 0) {
        const orderIds =
          loadedOrders.map(
            (order) => order.id
          );

        const {
          data: items,
          error: itemsError,
        } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsError) {
          console.error(
            "LOAD ORDER ITEMS ERROR:",
            itemsError
          );
        } else {
          const grouped: Record<
            number,
            OrderItem[]
          > = {};

          const initialQuantities: Record<
            number,
            number
          > = {};

          (items || []).forEach(
            (item) => {
              const currentItem =
                item as OrderItem;

              if (
                !grouped[
                  currentItem.order_id
                ]
              ) {
                grouped[
                  currentItem.order_id
                ] = [];
              }

              grouped[
                currentItem.order_id
              ].push(currentItem);

              initialQuantities[
                currentItem.id
              ] = Number(
                currentItem.quantity
              );
            }
          );

          setOrderItems(grouped);

          setQuantityValues(
            initialQuantities
          );

          setOriginalQuantityValues(
            initialQuantities
          );
        }
      } else {
        setOrderItems({});
        setQuantityValues({});
        setOriginalQuantityValues({});
      }

      await loadProducts();
      await loadQuantityChanges();
      await loadAdminNotifications();
    } catch (error) {
      console.error(
        "ADMIN LOAD ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء تحميل لوحة التحكم."
      );

      setOrders([]);
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // هل يوجد تعديلات؟
  // =====================================================

  function hasOrderChanges(
    order: Order
  ) {
    const draftStatus =
      draftStatuses[order.id] ??
      order.status;

    if (
      draftStatus !== order.status
    ) {
      return true;
    }

    const items =
      orderItems[order.id] || [];

    return items.some((item) => {
      const draftQuantity =
        quantityValues[item.id] ??
        item.quantity;

      const originalQuantity =
        originalQuantityValues[
          item.id
        ] ?? item.quantity;

      return (
        Number(draftQuantity) !==
        Number(originalQuantity)
      );
    });
  }

  // =====================================================
  // خصم المخزون
  // =====================================================

  async function deductStock(
    order: Order,
    items: OrderItem[]
  ) {
    // =====================================================
    // حماية من الخصم المتكرر
    // =====================================================

    if (order.stock_deducted) {
      console.log(
        "STOCK ALREADY DEDUCTED - NO DUPLICATE DEDUCTION:",
        order.id
      );

      return true;
    }

    if (items.length === 0) {
      alert(
        "لا يمكن خصم المخزون لأن الطلب لا يحتوي على منتجات."
      );

      return false;
    }

    // =====================================================
    // قراءة آخر مخزون من قاعدة البيانات
    // =====================================================

    const {
      data: freshProducts,
      error: freshProductsError,
    } = await supabase
      .from("products")
      .select(
        "id,name_ar,name_en,image_url,stock"
      );

    if (freshProductsError) {
      alert(
        "فشل قراءة المخزون الحالي:\n" +
          freshProductsError.message
      );

      return false;
    }

    const freshProductMap: Record<
      number,
      Product
    > = {};

    (
      freshProducts || []
    ).forEach((product) => {
      const p =
        product as Product;

      freshProductMap[p.id] = p;
    });

    // =====================================================
    // فحص المخزون بالكامل قبل الخصم
    // =====================================================

    for (const item of items) {
      const product =
        freshProductMap[
          item.product_id
        ];

      if (!product) {
        alert(
          `المنتج "${item.product_name}" غير موجود في المخزون.`
        );

        return false;
      }

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        alert(
          `الكمية الخاصة بالمنتج "${item.product_name}" غير صحيحة.`
        );

        return false;
      }

      if (
        product.stock < quantity
      ) {
        alert(
          `لا يوجد مخزون كافٍ من "${item.product_name}".\n\nالمخزون الحالي: ${product.stock}\nالمطلوب: ${quantity}`
        );

        await loadProducts();

        return false;
      }
    }

    setStockUpdatingId(
      order.id
    );

    try {
      // =====================================================
      // الخصم
      // =====================================================

      for (const item of items) {
        const product =
          freshProductMap[
            item.product_id
          ];

        const quantity =
          Number(item.quantity);

        const newStock =
          product.stock - quantity;

        const {
          error,
        } = await supabase
          .from("products")
          .update({
            stock: newStock,
          })
          .eq(
            "id",
            item.product_id
          );

        if (error) {
          console.error(
            "STOCK DEDUCT ERROR:",
            error
          );

          alert(
            `حدث خطأ أثناء خصم مخزون "${item.product_name}":\n${error.message}`
          );

          await loadProducts();

          return false;
        }
      }

      // =====================================================
      // تسجيل أن المخزون مخصوم
      // =====================================================

      const {
        error: flagError,
      } = await supabase
        .from("orders")
        .update({
          stock_deducted: true,
        })
        .eq(
          "id",
          order.id
        )
        .eq(
          "stock_deducted",
          false
        );

      if (flagError) {
        console.error(
          "SET STOCK DEDUCTED ERROR:",
          flagError
        );

        alert(
          "تم خصم المخزون ولكن حدث خطأ أثناء تسجيل حالة الخصم:\n" +
            flagError.message
        );

        await loadProducts();

        return false;
      }

      await loadProducts();

      return true;
    } finally {
      setStockUpdatingId(
        null
      );
    }
  }

  // =====================================================
  // إعادة المخزون
  // =====================================================

  async function restoreStock(
    order: Order,
    items: OrderItem[]
  ) {
    // =====================================================
    // حماية من الإرجاع المتكرر
    // =====================================================

    if (!order.stock_deducted) {
      console.log(
        "STOCK NOT DEDUCTED - NO RESTORE NEEDED:",
        order.id
      );

      return true;
    }

    if (items.length === 0) {
      alert(
        "لا توجد منتجات لإعادة مخزونها."
      );

      return false;
    }

    setStockUpdatingId(
      order.id
    );

    try {
      // =====================================================
      // قراءة آخر مخزون فعلي
      // =====================================================

      const {
        data: freshProducts,
        error: freshProductsError,
      } = await supabase
        .from("products")
        .select(
          "id,name_ar,name_en,image_url,stock"
        );

      if (freshProductsError) {
        alert(
          "فشل قراءة المخزون الحالي:\n" +
            freshProductsError.message
        );

        return false;
      }

      const freshProductMap: Record<
        number,
        Product
      > = {};

      (
        freshProducts || []
      ).forEach((product) => {
        const p =
          product as Product;

        freshProductMap[p.id] = p;
      });

      // =====================================================
      // إعادة الكميات
      // =====================================================

      for (const item of items) {
        const product =
          freshProductMap[
            item.product_id
          ];

        if (!product) {
          alert(
            `المنتج "${item.product_name}" غير موجود في المخزون.`
          );

          return false;
        }

        const quantity =
          Number(item.quantity);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          alert(
            `الكمية الخاصة بالمنتج "${item.product_name}" غير صحيحة.`
          );

          return false;
        }

        const newStock =
          product.stock + quantity;

        const {
          error,
        } = await supabase
          .from("products")
          .update({
            stock: newStock,
          })
          .eq(
            "id",
            item.product_id
          );

        if (error) {
          console.error(
            "RESTORE STOCK ERROR:",
            error
          );

          alert(
            `حدث خطأ أثناء إعادة مخزون "${item.product_name}":\n${error.message}`
          );

          await loadProducts();

          return false;
        }
      }

      // =====================================================
      // تسجيل أن المخزون لم يعد مخصومًا
      // =====================================================

      const {
        error: flagError,
      } = await supabase
        .from("orders")
        .update({
          stock_deducted: false,
        })
        .eq(
          "id",
          order.id
        )
        .eq(
          "stock_deducted",
          true
        );

      if (flagError) {
        console.error(
          "SET STOCK RESTORED ERROR:",
          flagError
        );

        alert(
          "تمت إعادة المخزون ولكن حدث خطأ أثناء تسجيل حالة المخزون:\n" +
            flagError.message
        );

        await loadProducts();

        return false;
      }

      await loadProducts();

      return true;
    } finally {
      setStockUpdatingId(
        null
      );
    }
  }

  // =====================================================
  // حفظ تغييرات الطلب
  // =====================================================

  async function saveOrderChanges(
    order: Order
  ) {
    if (
      savingOrderId === order.id
    ) {
      return;
    }

    const newStatus =
      draftStatuses[order.id] ??
      order.status;

    const items =
      orderItems[order.id] || [];

    const changedItems =
      items.filter((item) => {
        const newQuantity =
          Number(
            quantityValues[item.id] ??
              item.quantity
          );

        const oldQuantity =
          Number(
            originalQuantityValues[
              item.id
            ] ?? item.quantity
          );

        return (
          newQuantity !==
          oldQuantity
        );
      });

    if (
      newStatus === order.status &&
      changedItems.length === 0
    ) {
      alert(
        "لا توجد تعديلات لحفظها."
      );

      return;
    }

    // =====================================================
    // منع تعديل الكمية بعد خروج الطلب من جديد
    // =====================================================

    if (
      changedItems.length > 0 &&
      newStatus !== "جديد"
    ) {
      alert(
        'تعديل الكمية متاح فقط عندما تكون حالة الطلب "جديد".'
      );

      return;
    }

    // =====================================================
    // فحص الكميات
    // =====================================================

    for (const item of changedItems) {
      const newQuantity =
        Number(
          quantityValues[item.id]
        );

      if (
        !Number.isInteger(
          newQuantity
        ) ||
        newQuantity < 1
      ) {
        alert(
          `الكمية الخاصة بالمنتج "${item.product_name}" غير صحيحة.`
        );

        return;
      }
    }

    setSavingOrderId(
      order.id
    );

    try {
      const oldStatus =
        order.status;

      // =====================================================
      // تغيير الحالة والمخزون
      // =====================================================

      if (
        newStatus !== oldStatus
      ) {
        // ===================================================
        // هل الحالة الجديدة تحتاج أن يكون المخزون مخصومًا؟
        // ===================================================

        const newStatusNeedsStock =
          shouldHaveStockDeducted(
            newStatus
          );

        // ===================================================
        // هل المخزون مخصوم بالفعل؟
        // ===================================================

        const oldStatusHadStock =
          order.stock_deducted;

        // ===================================================
        // خصم المخزون
        //
        // يحصل فقط إذا:
        // الحالة الجديدة تحتاج خصم
        // + المخزون غير مخصوم بالفعل
        // ===================================================

        if (
          newStatusNeedsStock &&
          !oldStatusHadStock
        ) {
          const success =
            await deductStock(
              order,
              items
            );

          if (!success) {
            return;
          }
        }

        // ===================================================
        // إعادة المخزون
        //
        // يحصل فقط إذا:
        // الحالة الجديدة = جديد أو ملغي
        // + المخزون مخصوم بالفعل
        // ===================================================

        if (
          !newStatusNeedsStock &&
          oldStatusHadStock
        ) {
          const success =
            await restoreStock(
              order,
              items
            );

          if (!success) {
            return;
          }
        }

        // ===================================================
        // حفظ الحالة الجديدة
        // ===================================================

        const {
          error: statusError,
        } = await supabase
          .from("orders")
          .update({
            status: newStatus,
          })
          .eq(
            "id",
            order.id
          );

        if (statusError) {
          alert(
            "فشل حفظ حالة الطلب:\n" +
              statusError.message
          );

          await loadOrders();

          return;
        }

        // ===================================================
        // إشعار العميل
        // ===================================================

        const {
          error:
            notificationError,
        } = await supabase
          .from("notifications")
          .insert({
            user_id:
              order.user_id,
            order_id:
              order.id,
            order_item_id:
              null,
            type:
              "order_status",
            title:
              "تحديث حالة طلبك 🚚",
            message:
              `تم تغيير حالة الطلب رقم ${order.id} إلى "${newStatus}".`,
            is_read: false,
          });

        if (
          notificationError
        ) {
          console.error(
            "CUSTOMER STATUS NOTIFICATION ERROR:",
            notificationError
          );
        }
      }

      // =====================================================
      // تعديلات الكميات
      // =====================================================

      for (
        const item of changedItems
      ) {
        const newQuantity =
          Number(
            quantityValues[
              item.id
            ]
          );

        const oldQuantity =
          Number(
            originalQuantityValues[
              item.id
            ] ?? item.quantity
          );

        // ===================================================
        // فحص تعديل معلق
        // ===================================================

        const {
          data:
            pendingChange,
          error:
            pendingError,
        } = await supabase
          .from(
            "order_quantity_changes"
          )
          .select("id")
          .eq(
            "order_item_id",
            item.id
          )
          .eq(
            "status",
            "pending"
          )
          .maybeSingle();

        if (pendingError) {
          alert(
            "حدث خطأ أثناء فحص تعديل الكمية:\n" +
              pendingError.message
          );

          return;
        }

        if (pendingChange) {
          alert(
            `المنتج "${item.product_name}" لديه بالفعل تعديل كمية في انتظار موافقة العميل.`
          );

          return;
        }

        // ===================================================
        // إنشاء تعديل كمية
        // ===================================================

        const {
          data: change,
          error:
            changeError,
        } = await supabase
          .from(
            "order_quantity_changes"
          )
          .insert({
            order_id:
              order.id,
            order_item_id:
              item.id,
            old_quantity:
              oldQuantity,
            new_quantity:
              newQuantity,
            status:
              "pending",
          })
          .select("*")
          .single();

        if (
          changeError ||
          !change
        ) {
          alert(
            "فشل إنشاء طلب تعديل الكمية:\n" +
              (changeError?.message ||
                "خطأ غير معروف")
          );

          return;
        }

        // ===================================================
        // إشعار العميل
        // ===================================================

        const {
          error:
            quantityNotificationError,
        } = await supabase
          .from("notifications")
          .insert({
            user_id:
              order.user_id,
            order_id:
              order.id,
            order_item_id:
              item.id,
            type:
              "quantity_change",
            title:
              "طلب تعديل كمية المنتج 📦",
            message:
              `الأدمن يريد تعديل كمية "${item.product_name}" من ${oldQuantity} إلى ${newQuantity}. يرجى الموافقة أو الرفض.`,
            is_read: false,
          });

        if (
          quantityNotificationError
        ) {
          await supabase
            .from(
              "order_quantity_changes"
            )
            .delete()
            .eq(
              "id",
              change.id
            );

          alert(
            "فشل إرسال إشعار العميل:\n" +
              quantityNotificationError.message
          );

          return;
        }
      }

      // =====================================================
      // تحديث الواجهة
      // =====================================================

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (currentOrder) =>
              currentOrder.id ===
              order.id
                ? {
                    ...currentOrder,
                    status:
                      newStatus,

                    // المخزون مخصوم فقط
                    // في الحالات غير جديد وملغي
                    stock_deducted:
                      shouldHaveStockDeducted(
                        newStatus
                      ),
                  }
                : currentOrder
          )
      );

      setDraftStatuses(
        (current) => ({
          ...current,
          [order.id]:
            newStatus,
        })
      );

      // =====================================================
      // إعادة الكمية القديمة في الواجهة
      // لأن تعديل الكمية ينتظر موافقة العميل
      // =====================================================

      if (
        changedItems.length > 0
      ) {
        setQuantityValues(
          (current) => {
            const updated = {
              ...current,
            };

            changedItems.forEach(
              (item) => {
                updated[
                  item.id
                ] = Number(
                  originalQuantityValues[
                    item.id
                  ] ??
                    item.quantity
                );
              }
            );

            return updated;
          }
        );
      }

      await loadProducts();
      await loadQuantityChanges();
      await loadAdminNotifications();

      alert(
        "تم حفظ التعديلات بنجاح ✅"
      );
    } catch (error) {
      console.error(
        "SAVE ORDER CHANGES ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء حفظ التعديلات."
      );
    } finally {
      setSavingOrderId(
        null
      );
    }
  }

  // =====================================================
  // تعليم إشعار كمقروء
  // =====================================================

  async function markAdminNotificationRead(
    notificationId: number
  ) {
    const {
      error,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq(
        "id",
        notificationId
      );

    if (error) {
      console.error(
        "MARK ADMIN NOTIFICATION ERROR:",
        error
      );

      return;
    }

    setNotifications(
      (current) =>
        current.map(
          (notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  is_read: true,
                }
              : notification
        )
    );
  }

  // =====================================================
  // تشغيل الصفحة + Realtime
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function start() {
      await loadOrders();

      if (!mounted) return;
    }

    start();

    // =====================================================
    // Realtime
    // =====================================================

    const channel =
      supabase
        .channel(
          "admin-dashboard-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          async () => {
            console.log(
              "REALTIME NOTIFICATION UPDATE"
            );

            await loadAdminNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          async () => {
            console.log(
              "REALTIME ORDER UPDATE"
            );

            await loadOrders();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "order_items",
          },
          async () => {
            console.log(
              "REALTIME ORDER ITEM UPDATE"
            );

            await loadOrders();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "order_quantity_changes",
          },
          async () => {
            console.log(
              "REALTIME QUANTITY CHANGE"
            );

            await loadQuantityChanges();
            await loadOrders();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
          },
          async () => {
            console.log(
              "REALTIME PRODUCT STOCK UPDATE"
            );

            await loadProducts();
          }
        )
        .subscribe((status) => {
          console.log(
            "ADMIN REALTIME STATUS:",
            status
          );
        });

    return () => {
      mounted = false;

      supabase.removeChannel(
        channel
      );
    };
  }, []);

  // =====================================================
  // الإحصائيات
  // =====================================================

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  const pendingChanges =
    quantityChanges.filter(
      (change) =>
        change.status ===
        "pending"
    );

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="text-xl font-bold text-green-700">
          جاري تحميل الطلبات...
        </div>
      </main>
    );
  }

  // =====================================================
  // منع الدخول
  // =====================================================

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-6"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            🚫
          </div>

          <h1 className="mt-5 text-2xl font-bold text-red-600">
            ممنوع الدخول
          </h1>

          <p className="mt-3 text-gray-600">
            ليس لديك صلاحية للوصول إلى لوحة تحكم الأدمن.
          </p>

          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            العودة للموقع
          </a>
        </div>
      </main>
    );
  }

  // =====================================================
  // الصفحة
  // =====================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              لوحة تحكم الأدمن
            </h1>

            <p className="text-sm text-gray-500">
              صيدلية الشفاء
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={
                loadOrders
              }
              className="rounded-lg bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700"
            >
              🔄 تحديث
            </button>

            <a
              href="/"
              className="rounded-lg border border-green-600 px-5 py-2 font-bold text-green-700 hover:bg-green-50"
            >
              العودة للموقع
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">

        {/* =====================================================
            إشعارات الأدمن
        ===================================================== */}

        {notifications.length > 0 && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-800">
                🔔 إشعارات الأدمن
              </h2>

              {unreadNotifications >
                0 && (
                <p className="mt-1 text-sm font-bold text-red-600">
                  لديك{" "}
                  {
                    unreadNotifications
                  }{" "}
                  إشعار جديد
                </p>
              )}
            </div>

            <div className="space-y-3">
              {notifications
                .slice(0, 10)
                .map(
                  (
                    notification
                  ) => (
                    <div
                      key={
                        notification.id
                      }
                      onClick={() =>
                        markAdminNotificationRead(
                          notification.id
                        )
                      }
                      className={`cursor-pointer rounded-xl border-2 p-4 ${
                        notification.is_read
                          ? "border-gray-200 bg-white"
                          : "border-blue-300 bg-blue-50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl">
                          {notification.type ===
                          "quantity_response"
                            ? "📦"
                            : "🔔"}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold text-gray-800">
                              {
                                notification.title
                              }
                            </h3>

                            {!notification.is_read && (
                              <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                جديد
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-gray-600">
                            {
                              notification.message
                            }
                          </p>

                          <p className="mt-2 text-xs text-gray-400">
                            {new Date(
                              notification.created_at
                            ).toLocaleString(
                              "ar-EG"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* =====================================================
            تعديلات الكميات المعلقة
        ===================================================== */}

        {pendingChanges.length >
          0 && (
          <div className="mb-8 rounded-2xl border-2 border-orange-300 bg-orange-50 p-5">
            <h2 className="text-xl font-bold text-orange-700">
              ⚠️ تعديلات كمية في انتظار العميل
            </h2>

            <p className="mt-2 text-orange-700">
              يوجد{" "}
              {
                pendingChanges.length
              }{" "}
              تعديل كمية لم تتم الموافقة عليه أو رفضه حتى الآن.
            </p>
          </div>
        )}

        {/* =====================================================
            المخزون الحالي
        ===================================================== */}

        <div className="mb-8 rounded-2xl border-2 border-purple-200 bg-purple-50 p-5">
          <h2 className="text-xl font-bold text-purple-700">
            📦 حالة المخزون
          </h2>

          <p className="mt-2 text-sm text-purple-600">
            يتم خصم المخزون عند انتقال الطلب من "جديد" أو "ملغي" إلى أي حالة تشغيلية.
            وعند إعادة الطلب من أي حالة مخصوم منها إلى "جديد" أو "ملغي" يتم إرجاع المخزون.
            الانتقال بين الحالات التشغيلية لا يخصم أو يرجع المخزون مرة أخرى.
          </p>
        </div>

        {/* =====================================================
            الطلبات
        ===================================================== */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            الطلبات
          </h2>

          <p className="mt-2 text-gray-500">
            جميع الطلبات التي تم استلامها من العملاء
          </p>
        </div>

        {orders.length ===
        0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">
              📦
            </div>

            <h3 className="mt-5 text-2xl font-bold text-gray-700">
              لا توجد طلبات
            </h3>

            <p className="mt-2 text-gray-500">
              عندما يقوم أحد العملاء بعمل طلب سيظهر هنا.
            </p>

            <button
              onClick={
                loadOrders
              }
              className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
            >
              🔄 تحديث الطلبات
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(
              (order) => {
                const items =
                  orderItems[
                    order.id
                  ] || [];

                const currentDraftStatus =
                  draftStatuses[
                    order.id
                  ] ??
                  order.status;

                const hasChanges =
                  hasOrderChanges(
                    order
                  );

                const canEditQuantity =
                  currentDraftStatus ===
                  "جديد";

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6">

                      {/* بيانات الطلب */}

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">
                              📦
                            </span>

                            <div>
                              <h3 className="text-xl font-bold text-gray-800">
                                {
                                  order.customer_name
                                }
                              </h3>

                              <p className="text-sm text-gray-500">
                                رقم الطلب:{" "}
                                {
                                  order.id
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 space-y-2 text-gray-700">
                            <p>
                              📞{" "}
                              <strong>
                                الهاتف:
                              </strong>{" "}
                              {
                                order.phone
                              }
                            </p>

                            <p>
                              📍{" "}
                              <strong>
                                العنوان:
                              </strong>{" "}
                              {
                                order.address
                              }
                            </p>

                            {order.notes && (
                              <p>
                                📝{" "}
                                <strong>
                                  ملاحظات:
                                </strong>{" "}
                                {
                                  order.notes
                                }
                              </p>
                            )}

                            <p>
                              💰{" "}
                              <strong>
                                الإجمالي:
                              </strong>{" "}
                              {
                                order.total
                              }{" "}
                              جنيه
                            </p>

                            <p>
                              📅{" "}
                              <strong>
                                التاريخ:
                              </strong>{" "}
                              {new Date(
                                order.created_at
                              ).toLocaleString(
                                "ar-EG"
                              )}
                            </p>

                            {order.stock_deducted ? (
                              <p className="font-bold text-green-700">
                                📦 المخزون مخصوم
                              </p>
                            ) : (
                              <p className="font-bold text-gray-500">
                                📦 المخزون غير مخصوم
                              </p>
                            )}
                          </div>
                        </div>

                        {/* حالة الطلب */}

                        <div className="w-full rounded-xl bg-gray-50 p-4 lg:w-72">
                          <p className="mb-3 text-sm font-bold text-gray-600">
                            حالة الطلب
                          </p>

                          <select
                            value={
                              currentDraftStatus
                            }
                            disabled={
                              savingOrderId ===
                                order.id ||
                              stockUpdatingId ===
                                order.id
                            }
                            onChange={(
                              e
                            ) =>
                              setDraftStatuses(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [order.id]:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-bold text-gray-800 outline-none focus:border-green-500"
                          >
                            {statusOptions.map(
                              (
                                status
                              ) => (
                                <option
                                  key={
                                    status.value
                                  }
                                  value={
                                    status.value
                                  }
                                >
                                  {
                                    status.label
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <p className="mt-2 text-center text-sm text-gray-500">
                            الحالة الحالية:{" "}
                            {
                              order.status
                            }
                          </p>

                          {stockUpdatingId ===
                            order.id && (
                            <p className="mt-3 text-center font-bold text-purple-600">
                              ⏳ جاري تحديث المخزون...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* =====================================================
                          المنتجات
                      ===================================================== */}

                      <div className="border-t pt-6">
                        <h3 className="mb-4 text-xl font-bold text-gray-800">
                          🛒 منتجات الطلب
                        </h3>

                        {items.length ===
                        0 ? (
                          <div className="rounded-xl bg-gray-50 p-5 text-center text-gray-500">
                            لا توجد تفاصيل للطلب.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {items.map(
                              (
                                item
                              ) => {
                                const pendingChange =
                                  quantityChanges.find(
                                    (
                                      change
                                    ) =>
                                      change.order_id ===
                                        order.id &&
                                      change.order_item_id ===
                                        item.id &&
                                      change.status ===
                                        "pending"
                                  );

                                const currentProduct =
                                  products[
                                    item.product_id
                                  ];

                                return (
                                  <div
                                    key={
                                      item.id
                                    }
                                    className="rounded-2xl border-2 border-gray-100 p-5"
                                  >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                      {/* صورة المنتج + البيانات */}

                                      <div className="flex flex-1 gap-5">

                                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                                          {currentProduct?.image_url ? (
                                            <img
                                              src={
                                                currentProduct.image_url
                                              }
                                              alt={
                                                currentProduct.name_ar ||
                                                item.product_name
                                              }
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center text-5xl">
                                              💊
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex-1">
                                          <h4 className="text-lg font-bold text-gray-800">
                                            {
                                              currentProduct?.name_ar ||
                                              item.product_name
                                            }
                                          </h4>

                                          {currentProduct?.name_en && (
                                            <p className="mt-1 text-sm text-gray-400">
                                              {
                                                currentProduct.name_en
                                              }
                                            </p>
                                          )}

                                          <p className="mt-2 text-gray-500">
                                            السعر:{" "}
                                            {
                                              item.price
                                            }{" "}
                                            جنيه
                                          </p>

                                          <div className="mt-3 flex flex-wrap gap-3">
                                            <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                                              الكمية الحالية:{" "}
                                              {
                                                item.quantity
                                              }
                                            </span>

                                            <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700">
                                              الكمية المطلوبة أصلاً:{" "}
                                              {
                                                item.requested_quantity
                                              }
                                            </span>

                                            <span className="rounded-lg bg-purple-50 px-3 py-2 text-sm font-bold text-purple-700">
                                              المخزون الحالي:{" "}
                                              {
                                                currentProduct
                                                  ?.stock ??
                                                0
                                              }
                                            </span>

                                            {item.customer_approval ===
                                              "approved" && (
                                              <span className="rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
                                                ✅ وافق العميل
                                              </span>
                                            )}

                                            {item.customer_approval ===
                                              "rejected" && (
                                              <span className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                                                ❌ رفض العميل
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* تعديل الكمية */}

                                      {canEditQuantity ? (
                                        <div className="w-full rounded-xl bg-orange-50 p-4 lg:w-80">
                                          <p className="mb-3 font-bold text-orange-700">
                                            🔢 تعديل الكمية
                                          </p>

                                          <input
                                            type="number"
                                            min="1"
                                            value={
                                              quantityValues[
                                                item.id
                                              ] ??
                                              item.quantity
                                            }
                                            disabled={
                                              !!pendingChange ||
                                              savingOrderId ===
                                                order.id
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setQuantityValues(
                                                (
                                                  current
                                                ) => ({
                                                  ...current,
                                                  [item.id]:
                                                    Number(
                                                      e
                                                        .target
                                                        .value
                                                    ),
                                                })
                                              )
                                            }
                                            className="w-full rounded-xl border border-orange-300 bg-white px-4 py-3 text-center font-bold text-gray-900 outline-none focus:border-orange-500"
                                          />

                                          {pendingChange && (
                                            <div className="mt-3 rounded-lg border border-orange-300 bg-white p-3 text-center text-sm font-bold text-orange-700">
                                              ⏳ تم إرسال طلب تعديل من{" "}
                                              {
                                                pendingChange.old_quantity
                                              }{" "}
                                              إلى{" "}
                                              {
                                                pendingChange.new_quantity
                                              }{" "}
                                              وننتظر موافقة العميل.
                                            </div>
                                          )}

                                          {!pendingChange &&
                                            item.customer_approval ===
                                              "approved" && (
                                              <p className="mt-3 text-center text-sm font-bold text-green-700">
                                                ✅ آخر تعديل تمت الموافقة عليه.
                                              </p>
                                            )}

                                          {!pendingChange &&
                                            item.customer_approval ===
                                              "rejected" && (
                                              <p className="mt-3 text-center text-sm font-bold text-red-700">
                                                ❌ آخر تعديل تم رفضه.
                                              </p>
                                            )}
                                        </div>
                                      ) : (
                                        <div className="w-full rounded-xl bg-gray-100 p-4 text-center lg:w-80">
                                          <p className="font-bold text-gray-600">
                                            🔒 تعديل الكمية غير متاح
                                          </p>

                                          <p className="mt-1 text-sm text-gray-500">
                                            متاح تعديل الكمية عندما تكون حالة الطلب "جديد".
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>

                      {/* =====================================================
                          زر الحفظ
                      ===================================================== */}

                      {hasChanges && (
                        <div className="border-t pt-6">
                          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-green-800">
                                  ✏️ يوجد تعديلات غير محفوظة
                                </h3>

                                <p className="mt-1 text-sm text-green-700">
                                  التغييرات لن يتم تنفيذها إلا بعد الضغط على زر الحفظ.
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  saveOrderChanges(
                                    order
                                  )
                                }
                                disabled={
                                  savingOrderId ===
                                    order.id ||
                                  stockUpdatingId ===
                                    order.id
                                }
                                className="rounded-xl bg-green-600 px-7 py-3 font-bold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                              >
                                {savingOrderId ===
                                  order.id ||
                                stockUpdatingId ===
                                  order.id
                                  ? "⏳ جاري الحفظ..."
                                  : "💾 حفظ التعديلات"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}