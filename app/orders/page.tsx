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

type OrdersApiResponse = {
  orders: Order[];
  orderItems: Record<number, OrderItem[]>;
  quantityChanges: QuantityChange[];
  notifications: Notification[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [orderItems, setOrderItems] = useState<
    Record<number, OrderItem[]>
  >({});

  const [quantityChanges, setQuantityChanges] = useState<
    QuantityChange[]
  >([]);

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [cancelingId, setCancelingId] =
    useState<number | null>(null);

  const [approvalId, setApprovalId] =
    useState<number | null>(null);

  // =====================================================
  // الاتصال بـ API
  // =====================================================

  async function apiRequest(
    action: string,
    body?: Record<string, unknown>
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("ORDERS SESSION:", session);

    if (!session?.access_token) {
      throw new Error(
        "لم يتم العثور على جلسة تسجيل الدخول على هذا الجهاز."
      );
    }

    const response = await fetch(
      "/api/customer/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          ...(body || {}),
        }),
        cache: "no-store",
      }
    );

    const text = await response.text();

    console.log(
      "ORDERS API STATUS:",
      response.status
    );

    console.log(
      "ORDERS API RESPONSE:",
      text
    );

    let result: any = {};

    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        `الخادم أرسل ردًا غير صالح. HTTP ${response.status}`
      );
    }

    if (!response.ok) {
      throw new Error(
        result?.error ||
          `حدث خطأ من الخادم. HTTP ${response.status}`
      );
    }

    return result;
  }

  // =====================================================
  // تحميل كل البيانات
  // =====================================================

  async function loadAllData(
    currentUserId?: string
  ) {
    try {
      if (currentUserId) {
        setUserId(currentUserId);
      }

      const result =
        (await apiRequest("load_all")) as OrdersApiResponse;

      console.log("LOAD ALL ORDERS RESULT:", result);

      setOrders(result.orders || []);
      setOrderItems(result.orderItems || {});
      setQuantityChanges(
        result.quantityChanges || []
      );
      setNotifications(
        result.notifications || []
      );
    } catch (error) {
      console.error(
        "LOAD ORDERS API ERROR:",
        error
      );

      setOrders([]);
      setOrderItems({});
      setQuantityChanges([]);
      setNotifications([]);

      throw error;
    }
  }

  // =====================================================
  // تحديث يدوي
  // =====================================================

  async function refreshOrders() {
    setRefreshing(true);

    try {
      await loadAllData(
        userId || undefined
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث الطلبات."
      );
    } finally {
      setRefreshing(false);
    }
  }

  // =====================================================
  // إيجاد التعديل المعلق
  // =====================================================

  function getPendingChange(
    itemId: number
  ) {
    return quantityChanges.find(
      (change) =>
        change.order_item_id === itemId &&
        change.status === "pending"
    );
  }

  // =====================================================
  // الرد على تعديل الكمية
  // =====================================================

  async function respondToQuantityChange(
    item: OrderItem,
    change: QuantityChange,
    approved: boolean
  ) {
    if (!userId) {
      alert(
        "يجب تسجيل الدخول أولاً."
      );
      return;
    }

    if (approvalId === item.id) {
      return;
    }

    const confirmed =
      window.confirm(
        approved
          ? `هل توافق على تعديل كمية "${item.product_name}" من ${change.old_quantity} إلى ${change.new_quantity}؟`
          : `هل أنت متأكد أنك تريد رفض تعديل كمية "${item.product_name}"؟`
      );

    if (!confirmed) {
      return;
    }

    setApprovalId(item.id);

    try {
      await apiRequest(
        "respond_quantity_change",
        {
          changeId: change.id,
          orderId: change.order_id,
          orderItemId: change.order_item_id,
          approved,
        }
      );

      await loadAllData(
        userId
      );

      if (approved) {
        alert(
          `تمت الموافقة بنجاح ✅\n\nالكمية الجديدة: ${change.new_quantity}`
        );
      } else {
        alert(
          `تم رفض التعديل ❌\n\nتم الاحتفاظ بالكمية الأصلية: ${change.old_quantity}`
        );
      }
    } catch (error) {
      console.error(
        "RESPOND QUANTITY ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إرسال ردك."
      );
    } finally {
      setApprovalId(null);
    }
  }

  // =====================================================
  // إلغاء الطلب
  // =====================================================

  async function cancelOrder(
    orderId: number
  ) {
    if (!userId) {
      return;
    }

    const confirmed =
      window.confirm(
        "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟"
      );

    if (!confirmed) {
      return;
    }

    setCancelingId(orderId);

    try {
      await apiRequest(
        "cancel_order",
        {
          orderId,
        }
      );

      setOrders(
        (current) =>
          current.map(
            (order) =>
              order.id === orderId
                ? {
                    ...order,
                    status: "ملغي",
                  }
                : order
          )
      );

      alert(
        "تم إلغاء الطلب بنجاح ❌"
      );

      await loadAllData(
        userId
      );
    } catch (error) {
      console.error(
        "CANCEL ORDER ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إلغاء الطلب."
      );
    } finally {
      setCancelingId(null);
    }
  }

  // =====================================================
  // تعليم الإشعار كمقروء
  // =====================================================

  async function markNotificationRead(
    notificationId: number
  ) {
    try {
      await apiRequest(
        "mark_notification_read",
        {
          notificationId,
        }
      );

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
    } catch (error) {
      console.error(
        "MARK NOTIFICATION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث الإشعار."
      );
    }
  }

  // =====================================================
  // تشغيل الصفحة
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function start() {
      setLoading(true);

      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (!user) {
          setUserId(null);
          setOrders([]);
          setOrderItems({});
          setQuantityChanges([]);
          setNotifications([]);
          setLoading(false);

          return;
        }

        console.log(
          "ORDERS CURRENT USER:",
          user.id
        );

        setUserId(user.id);

        await loadAllData(
          user.id
        );
      } catch (error) {
        console.error(
          "START ORDERS ERROR:",
          error
        );

        if (mounted) {
          alert(
            error instanceof Error
              ? error.message
              : "تعذر تحميل طلباتك."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    start();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // Realtime
  // =====================================================

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel =
      supabase
        .channel(
          `customer-orders-live-${userId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter:
              `user_id=eq.${userId}`,
          },
          async () => {
            try {
              await loadAllData(
                userId
              );
            } catch (error) {
              console.error(
                "REALTIME NOTIFICATION ERROR:",
                error
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter:
              `user_id=eq.${userId}`,
          },
          async () => {
            try {
              await loadAllData(
                userId
              );
            } catch (error) {
              console.error(
                "REALTIME ORDER ERROR:",
                error
              );
            }
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
            try {
              await loadAllData(
                userId
              );
            } catch (error) {
              console.error(
                "REALTIME ITEM ERROR:",
                error
              );
            }
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
            try {
              await loadAllData(
                userId
              );
            } catch (error) {
              console.error(
                "REALTIME QUANTITY ERROR:",
                error
              );
            }
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [userId]);

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 px-6"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            📦
          </div>

          <h1 className="mt-4 text-2xl font-bold text-green-700">
            طلباتي
          </h1>

          <p className="mt-4 text-lg font-bold text-gray-700">
            جاري تحميل طلباتك...
          </p>

          <p className="mt-2 text-sm text-gray-400">
            برجاء الانتظار
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // تسجيل الدخول
  // =====================================================

  if (!userId) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-6"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            🔐
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-800">
            يجب تسجيل الدخول
          </h1>

          <p className="mt-3 text-gray-500">
            سجل دخولك أولًا حتى تستطيع مشاهدة طلباتك.
          </p>

          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            تسجيل الدخول
          </a>

          <br />

          <a
            href="/"
            className="mt-3 inline-block text-green-700 hover:underline"
          >
            العودة للموقع
          </a>
        </div>
      </main>
    );
  }

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.is_read
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              طلباتي
            </h1>

            <p className="text-sm text-gray-500">
              صيدلية الشفاء
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-xl border border-green-600 px-5 py-2 font-bold text-green-700 hover:bg-green-50"
            >
              🏠 الرئيسية
            </a>

            <button
              onClick={
                refreshOrders
              }
              disabled={
                refreshing
              }
              className="rounded-xl bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? "جاري التحديث..."
                : "🔄 تحديث"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* =====================================================
            إشعارات العميل
        ===================================================== */}

        {notifications.length >
          0 && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  🔔 الإشعارات
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {unreadNotifications.length >
                  0
                    ? `لديك ${unreadNotifications.length} إشعار غير مقروء`
                    : "لا توجد إشعارات جديدة"}
                </p>
              </div>

              {unreadNotifications.length >
                0 && (
                <span className="rounded-full bg-red-600 px-4 py-2 font-bold text-white">
                  {
                    unreadNotifications.length
                  }
                </span>
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
                      className={`rounded-xl border-2 p-4 ${
                        notification.is_read
                          ? "border-gray-200 bg-gray-50"
                          : "border-green-300 bg-green-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">
                            {
                              notification.title
                            }
                          </h3>

                          <p className="mt-2 text-gray-700">
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

                        {!notification.is_read && (
                          <button
                            onClick={() =>
                              markNotificationRead(
                                notification.id
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                          >
                            تم الاطلاع
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* =====================================================
            الطلبات
        ===================================================== */}

        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">
              📦
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-700">
              لا توجد طلبات
            </h2>

            <p className="mt-2 text-gray-500">
              لم تقم بعمل أي طلب حتى الآن.
            </p>

            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
            >
              🛒 تصفح المنتجات
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(
              (order) => {
                const isCancelled =
                  order.status ===
                  "ملغي";

                const items =
                  orderItems[
                    order.id
                  ] || [];

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            📦
                          </span>

                          <div>
                            <h2 className="text-xl font-bold text-gray-800">
                              طلب رقم{" "}
                              {
                                order.id
                              }
                            </h2>

                            <p className="text-sm text-gray-500">
                              {new Date(
                                order.created_at
                              ).toLocaleString(
                                "ar-EG"
                              )}
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
                                الملاحظات:
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
                        </div>

                        {!isCancelled &&
                          (order.status ===
                            "جديد" ||
                            order.status ===
                              "pending") && (
                            <button
                              onClick={() =>
                                cancelOrder(
                                  order.id
                                )
                              }
                              disabled={
                                cancelingId ===
                                order.id
                              }
                              className="mt-6 rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {cancelingId ===
                              order.id
                                ? "جاري الإلغاء..."
                                : "❌ إلغاء الطلب"}
                            </button>
                          )}
                      </div>

                      <div
                        className={`h-fit min-w-[190px] rounded-xl px-6 py-4 text-center ${
                          isCancelled
                            ? "bg-red-50"
                            : order.status ===
                              "تم التسليم"
                            ? "bg-green-50"
                            : order.status ===
                              "تم الشحن"
                            ? "bg-blue-50"
                            : order.status ===
                              "قيد التجهيز"
                            ? "bg-orange-50"
                            : "bg-yellow-50"
                        }`}
                      >
                        <p className="text-sm text-gray-500">
                          حالة الطلب
                        </p>

                        <p
                          className={`mt-1 text-lg font-bold ${
                            isCancelled
                              ? "text-red-700"
                              : order.status ===
                                "تم التسليم"
                              ? "text-green-700"
                              : order.status ===
                                "تم الشحن"
                              ? "text-blue-700"
                              : order.status ===
                                "قيد التجهيز"
                              ? "text-orange-700"
                              : "text-yellow-700"
                          }`}
                        >
                          {
                            order.status
                          }
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          يتم تحديث الحالة من الأدمن
                        </p>
                      </div>
                    </div>

                    {/* =====================================================
                        منتجات الطلب
                    ===================================================== */}

                    <div className="mt-8 border-t pt-6">
                      <h3 className="mb-5 text-xl font-bold text-gray-800">
                        🛒 منتجات الطلب
                      </h3>

                      {items.length ===
                      0 ? (
                        <div className="rounded-xl bg-gray-50 p-5 text-center text-gray-500">
                          لا توجد تفاصيل للمنتجات
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {items.map(
                            (item) => {
                              const pendingChange =
                                getPendingChange(
                                  item.id
                                );

                              const hasPending =
                                !!pendingChange;

                              const approved =
                                item.customer_approval ===
                                "approved";

                              const rejected =
                                item.customer_approval ===
                                "rejected";

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="rounded-2xl border-2 border-gray-200 p-5"
                                >
                                  <div className="mb-5">
                                    <h4 className="text-xl font-bold text-gray-800">
                                      💊{" "}
                                      {
                                        item.product_name
                                      }
                                    </h4>

                                    <p className="mt-1 text-sm text-gray-500">
                                      سعر الوحدة:{" "}
                                      {
                                        item.price
                                      }{" "}
                                      جنيه
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                                      <p className="text-sm font-bold text-blue-600">
                                        🔵 الكمية المطلوبة
                                      </p>

                                      <p className="mt-1 text-3xl font-black text-blue-700">
                                        {
                                          item.requested_quantity
                                        }
                                      </p>
                                    </div>

                                    <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
                                      <p className="text-sm font-bold text-green-600">
                                        🟢 الكمية الحالية
                                      </p>

                                      <p className="mt-1 text-3xl font-black text-green-700">
                                        {
                                          item.quantity
                                        }
                                      </p>
                                    </div>

                                    {hasPending &&
                                      pendingChange && (
                                        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
                                          <p className="text-sm font-bold text-orange-600">
                                            🟠 اقتراح الأدمن
                                          </p>

                                          <p className="mt-1 text-3xl font-black text-orange-700">
                                            {
                                              pendingChange.new_quantity
                                            }
                                          </p>
                                        </div>
                                      )}
                                  </div>

                                  {/* تعديل معلق */}

                                  {hasPending &&
                                    pendingChange && (
                                      <div className="mt-5 rounded-xl border-2 border-orange-300 bg-orange-50 p-5">
                                        <h4 className="font-bold text-orange-800">
                                          📢 يوجد تعديل من الأدمن
                                        </h4>

                                        <p className="mt-2 text-gray-700">
                                          {item.approval_message ||
                                            `الأدمن يقترح تعديل الكمية من ${pendingChange.old_quantity} إلى ${pendingChange.new_quantity}.`}
                                        </p>

                                        <div className="mt-4 rounded-xl bg-white p-4 text-center">
                                          <p className="text-sm text-gray-500">
                                            الكمية الأصلية
                                          </p>

                                          <p className="text-2xl font-black text-blue-700">
                                            {
                                              pendingChange.old_quantity
                                            }
                                          </p>

                                          <p className="my-2 text-gray-400">
                                            ↓
                                          </p>

                                          <p className="text-sm text-gray-500">
                                            الكمية المقترحة
                                          </p>

                                          <p className="text-3xl font-black text-orange-600">
                                            {
                                              pendingChange.new_quantity
                                            }
                                          </p>
                                        </div>

                                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                          <button
                                            onClick={() =>
                                              respondToQuantityChange(
                                                item,
                                                pendingChange,
                                                true
                                              )
                                            }
                                            disabled={
                                              approvalId ===
                                              item.id
                                            }
                                            className="flex-1 rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {approvalId ===
                                            item.id
                                              ? "جاري التنفيذ..."
                                              : "✅ موافق على التعديل"}
                                          </button>

                                          <button
                                            onClick={() =>
                                              respondToQuantityChange(
                                                item,
                                                pendingChange,
                                                false
                                              )
                                            }
                                            disabled={
                                              approvalId ===
                                              item.id
                                            }
                                            className="flex-1 rounded-xl bg-red-600 px-6 py-4 text-lg font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {approvalId ===
                                            item.id
                                              ? "جاري التنفيذ..."
                                              : "❌ رفض التعديل"}
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                  {/* تمت الموافقة */}

                                  {approved &&
                                    !hasPending && (
                                      <div className="mt-5 rounded-xl border-2 border-green-300 bg-green-50 p-5 text-center">
                                        <p className="text-lg font-bold text-green-700">
                                          ✅ تمت الموافقة على تعديل الكمية
                                        </p>

                                        <p className="mt-2 text-sm text-green-600">
                                          الكمية المعتمدة حاليًا:{" "}
                                          {
                                            item.quantity
                                          }
                                        </p>
                                      </div>
                                    )}

                                  {/* تم الرفض */}

                                  {rejected &&
                                    !hasPending && (
                                      <div className="mt-5 rounded-xl border-2 border-red-300 bg-red-50 p-5 text-center">
                                        <p className="text-lg font-bold text-red-700">
                                          ❌ تم رفض اقتراح تعديل الكمية
                                        </p>

                                        <p className="mt-2 text-sm text-red-600">
                                          تم الاحتفاظ بالكمية الأصلية وإبلاغ الأدمن.
                                        </p>

                                        <p className="mt-2 text-sm font-bold text-gray-700">
                                          الكمية الحالية:{" "}
                                          {
                                            item.quantity
                                          }
                                        </p>
                                      </div>
                                    )}
                                </div>
                              );
                            }
                          )}
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