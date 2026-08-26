"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";

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
  hidden_from_customer?: boolean;
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

type ProductStock = {
  id: number;
  stock: number;
};

type RealtimeNotificationPayload = {
  new: Notification;
  old?: Notification;
};

const statusOptions = [
  {
    value: "جديد",
  },
  {
    value: "قيد التجهيز",
  },
  {
    value: "تم الشحن",
  },
  {
    value: "تم التسليم",
  },
  {
    value: "ملغي",
  },
];

export default function OrdersPage() {
  const {
    language,
    toggleLanguage,
    dir,
  } = useLanguage();

  const isArabic =
    language === "ar";

  function getStatusLabel(
    status: string
  ) {
    if (status === "جديد") {
      return isArabic
        ? "جديد"
        : "New";
    }

    if (status === "قيد التجهيز") {
      return isArabic
        ? "قيد التجهيز"
        : "Preparing";
    }

    if (status === "تم الشحن") {
      return isArabic
        ? "تم الشحن"
        : "Shipped";
    }

    if (status === "تم التسليم") {
      return isArabic
        ? "تم التسليم"
        : "Delivered";
    }

    if (status === "ملغي") {
      return isArabic
        ? "ملغي"
        : "Cancelled";
    }

    if (status === "pending") {
      return isArabic
        ? "قيد الانتظار"
        : "Pending";
    }

    return status;
  }

  const t = {
    myOrders: isArabic
      ? "طلباتي"
      : "My Orders",

    pharmacyName: isArabic
      ? "صيدلية الشفاء"
      : "Al Shifa Pharmacy",

    languageButton: isArabic
      ? "English"
      : "العربية",

    loadingOrders: isArabic
      ? "جاري تحميل طلباتك..."
      : "Loading your orders...",

    pleaseWait: isArabic
      ? "برجاء الانتظار"
      : "Please wait",

    loginRequired: isArabic
      ? "يجب تسجيل الدخول"
      : "Login required",

    loginRequiredText: isArabic
      ? "سجل دخولك أولًا حتى تستطيع مشاهدة طلباتك."
      : "Please log in first to view your orders.",

    login: isArabic
      ? "تسجيل الدخول"
      : "Login",

    notificationSound: isArabic
      ? "🔔 تفعيل صوت التنبيهات"
      : "🔔 Enable notification sound",

    soundEnabled: isArabic
      ? "🔊 الصوت مفعل"
      : "🔊 Sound enabled",

    notifications: isArabic
      ? "🔔 الإشعارات"
      : "🔔 Notifications",

    trash: isArabic
      ? "🗑️ سلة المحذوفات"
      : "🗑️ Trash",

    home: isArabic
      ? "🏠 الرئيسية"
      : "🏠 Home",

    refresh: isArabic
      ? "🔄 تحديث"
      : "🔄 Refresh",

    refreshing: isArabic
      ? "جاري التحديث..."
      : "Refreshing...",

    ordersManagement: isArabic
      ? "🗑️ إدارة طلباتي"
      : "🗑️ Manage my orders",

    ordersManagementText: isArabic
      ? "الحذف هنا إخفاء من حسابك فقط، ولن يحذف الطلب من عند الأدمن."
      : "Deleting here only hides orders from your account. Orders remain visible to the admin.",

    deleteStatus: isArabic
      ? "🗑️ حذف"
      : "🗑️ Hide",

    deleteAllOrders: isArabic
      ? "🗑️ حذف كل الطلبات"
      : "🗑️ Hide all orders",

    noOrders: isArabic
      ? "لا توجد طلبات"
      : "No orders",

    browseProducts: isArabic
      ? "🛒 تصفح المنتجات"
      : "🛒 Browse products",

    orderNumber: isArabic
      ? "طلب رقم"
      : "Order #",

    phone: isArabic
      ? "الهاتف"
      : "Phone",

    address: isArabic
      ? "العنوان"
      : "Address",

    notes: isArabic
      ? "الملاحظات"
      : "Notes",

    total: isArabic
      ? "الإجمالي"
      : "Total",

    status: isArabic
      ? "حالة الطلب"
      : "Order status",

    cancelOrder: isArabic
      ? "❌ إلغاء الطلب"
      : "❌ Cancel order",

    canceling: isArabic
      ? "جاري الإلغاء..."
      : "Cancelling...",

    hideFromOrders: isArabic
      ? "🗑️ حذف من طلباتي"
      : "🗑️ Hide from my orders",

    moving: isArabic
      ? "⏳ جاري النقل..."
      : "⏳ Moving...",

    orderProducts: isArabic
      ? "🛒 منتجات الطلب"
      : "🛒 Order products",

    unitPrice: isArabic
      ? "سعر الوحدة"
      : "Unit price",

    requestedQuantity: isArabic
      ? "الكمية المطلوبة"
      : "Requested quantity",

    currentQuantity: isArabic
      ? "الكمية الحالية"
      : "Current quantity",

    adminSuggestion: isArabic
      ? "اقتراح الأدمن"
      : "Admin suggestion",

    editQuantity: isArabic
      ? "✏️ تعديل الكمية"
      : "✏️ Edit quantity",

    save: isArabic
      ? "💾 حفظ"
      : "💾 Save",

    saving: isArabic
      ? "⏳ جاري الحفظ..."
      : "⏳ Saving...",

    cancel: isArabic
      ? "إلغاء"
      : "Cancel",

    quantityUnavailable: isArabic
      ? "🔒 تعديل الكمية غير متاح حاليًا"
      : "🔒 Quantity editing is currently unavailable",

    quantityUnavailableText: isArabic
      ? 'يمكن تعديل الكمية فقط عندما تكون حالة الطلب "جديد".'
      : 'Quantity can only be edited when the order status is "New".',

    adminQuantityChange: isArabic
      ? "📢 يوجد تعديل من الأدمن"
      : "📢 Admin requested a quantity change",

    originalQuantity: isArabic
      ? "الكمية الأصلية"
      : "Original quantity",

    proposedQuantity: isArabic
      ? "الكمية المقترحة"
      : "Proposed quantity",

    approve: isArabic
      ? "✅ موافق على التعديل"
      : "✅ Approve change",

    reject: isArabic
      ? "❌ رفض التعديل"
      : "❌ Reject change",

    executing: isArabic
      ? "⏳ جاري التنفيذ..."
      : "⏳ Processing...",

    approvedMessage: isArabic
      ? "✅ تمت الموافقة على تعديل الكمية"
      : "✅ Quantity change approved",

    approvedCurrent: isArabic
      ? "الكمية المعتمدة حاليًا"
      : "Currently approved quantity",

    rejectedMessage: isArabic
      ? "❌ تم رفض اقتراح تعديل الكمية"
      : "❌ Quantity change rejected",

    rejectedText: isArabic
      ? "تم الاحتفاظ بالكمية الأصلية وإبلاغ الأدمن."
      : "The original quantity was kept and the admin was notified.",

    current: isArabic
      ? "الكمية الحالية"
      : "Current quantity",

    trashTitle: isArabic
      ? "🗑️ سلة المحذوفات"
      : "🗑️ Trash",

    trashText: isArabic
      ? "الطلبات مخفية من حسابك فقط."
      : "Orders are hidden from your account only.",

    restoreAll: isArabic
      ? "♻️ استرجاع الكل"
      : "♻️ Restore all",

    restoringAll: isArabic
      ? "⏳ جاري الاسترجاع..."
      : "⏳ Restoring...",

    emptyTrash: isArabic
      ? "سلة المحذوفات فارغة"
      : "Trash is empty",

    restoreOrder: isArabic
      ? "♻️ استرجاع الطلب"
      : "♻️ Restore order",

    restoring: isArabic
      ? "⏳ جاري الاسترجاع..."
      : "⏳ Restoring...",

    notificationCount: isArabic
      ? "إشعار غير مقروء"
      : "unread notification(s)",

    readAll: isArabic
      ? "✅ قراءة الكل"
      : "✅ Mark all as read",

    deleteAllNotifications: isArabic
      ? "🗑️ حذف الكل"
      : "🗑️ Delete all",

    deleting: isArabic
      ? "⏳ جاري الحذف..."
      : "⏳ Deleting...",

    noNotifications: isArabic
      ? "لا توجد إشعارات"
      : "No notifications",

    read: isArabic
      ? "✅ قراءة"
      : "✅ Read",

    delete: isArabic
      ? "🗑️ حذف"
      : "🗑️ Delete",

    needApproval: isArabic
      ? "⚠️ مطلوب موافقتك"
      : "⚠️ Your approval is required",

    approved: isArabic
      ? "✅ تمت الموافقة على التعديل"
      : "✅ Change approved",

    rejected: isArabic
      ? "❌ تم رفض التعديل"
      : "❌ Change rejected",

    loadError: isArabic
      ? "تعذر تحميل طلباتك."
      : "Unable to load your orders.",

    sessionMissing: isArabic
      ? "لم يتم العثور على جلسة تسجيل الدخول على هذا الجهاز."
      : "No login session was found on this device.",

    invalidServerResponse: isArabic
      ? "الخادم أرسل ردًا غير صالح."
      : "The server returned an invalid response.",

    unexpectedError: isArabic
      ? "حدث خطأ غير متوقع."
      : "An unexpected error occurred.",

    soundUnsupported: isArabic
      ? "المتصفح لا يدعم تشغيل صوت التنبيهات."
      : "Your browser does not support notification sounds.",

    soundFailed: isArabic
      ? "تعذر تفعيل صوت التنبيهات."
      : "Unable to enable notification sounds.",
  };

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [trashOrders, setTrashOrders] =
    useState<Order[]>([]);

  const [orderItems, setOrderItems] =
    useState<Record<number, OrderItem[]>>(
      {}
    );

  const [quantityChanges, setQuantityChanges] =
    useState<QuantityChange[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [productStocks, setProductStocks] =
    useState<Record<number, number>>({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [cancelingId, setCancelingId] =
    useState<number | null>(null);

  const [approvalId, setApprovalId] =
    useState<number | null>(null);

  const [editingItemId, setEditingItemId] =
    useState<number | null>(null);

  const [draftQuantities, setDraftQuantities] =
    useState<Record<number, number>>({});

  const [savingQuantityItemId, setSavingQuantityItemId] =
    useState<number | null>(null);

  const [deletingNotificationId, setDeletingNotificationId] =
    useState<number | null>(null);

  const [deletingAllNotifications, setDeletingAllNotifications] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [trashOpen, setTrashOpen] =
    useState(false);

  const [trashLoading, setTrashLoading] =
    useState(false);

  const [hidingOrderId, setHidingOrderId] =
    useState<number | null>(null);

  const [hidingStatus, setHidingStatus] =
    useState<string | null>(null);

  const [hidingAll, setHidingAll] =
    useState(false);

  const [restoringOrderId, setRestoringOrderId] =
    useState<number | null>(null);

  const [restoringAll, setRestoringAll] =
    useState(false);

  const [soundEnabled, setSoundEnabled] =
    useState(false);

  const soundEnabledRef =
    useRef(false);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const lastKnownNotificationIdRef =
    useRef<number | null>(null);

  const realtimeLoadingRef =
    useRef(false);

  const locallyDeletedNotificationIdsRef =
    useRef<Set<number>>(
      new Set()
    );

  const newNotificationIdsRef =
    useRef<Set<number>>(
      new Set()
    );

  const editingItemIdRef =
    useRef<number | null>(
      null
    );

  const savingQuantityItemIdRef =
    useRef<number | null>(
      null
    );

  // =====================================================
  // تثبيت قيم التعديل الحالية للـ polling
  // =====================================================

  useEffect(() => {
    editingItemIdRef.current =
      editingItemId;
  }, [editingItemId]);

  useEffect(() => {
    savingQuantityItemIdRef.current =
      savingQuantityItemId;
  }, [savingQuantityItemId]);

  // =====================================================
  // API
  // =====================================================

  async function apiRequest(
    action: string,
    body?: Record<string, unknown>
  ) {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        t.sessionMissing
      );
    }

    const response =
      await fetch(
        "/api/customer/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action,
            ...(body || {}),
          }),
          cache: "no-store",
        }
      );

    const text =
      await response.text();

    let result: unknown = {};

    try {
      result =
        JSON.parse(text);
    } catch {
      throw new Error(
        `${t.invalidServerResponse} HTTP ${response.status}`
      );
    }

    if (!response.ok) {
      const errorMessage =
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : `${t.unexpectedError} HTTP ${response.status}`;

      throw new Error(
        errorMessage
      );
    }

    return result;
  }

  // =====================================================
  // الصوت
  // =====================================================

  function createAudioContext() {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (
      !audioContextRef.current
    ) {
      audioContextRef.current =
        new AudioContextClass();
    }

    return audioContextRef.current;
  }

  async function enableNotificationSound() {
    try {
      const audioContext =
        createAudioContext();

      if (!audioContext) {
        alert(
          t.soundUnsupported
        );

        return;
      }

      if (
        audioContext.state ===
        "suspended"
      ) {
        await audioContext.resume();
      }

      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      oscillator.type =
        "sine";

      oscillator.frequency.setValueAtTime(
        700,
        audioContext.currentTime
      );

      oscillator.frequency.setValueAtTime(
        950,
        audioContext.currentTime +
          0.12
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.22,
        audioContext.currentTime +
          0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          0.3
      );

      oscillator.connect(
        gainNode
      );

      gainNode.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime +
          0.3
      );

      soundEnabledRef.current =
        true;

      setSoundEnabled(
        true
      );
    } catch (error) {
      console.error(
        "ENABLE CUSTOMER SOUND ERROR:",
        error
      );

      alert(
        t.soundFailed
      );
    }
  }

  function playNotificationSound(
    notification?: Notification
  ) {
    if (
      !soundEnabledRef.current
    ) {
      return;
    }

    try {
      const audioContext =
        createAudioContext();

      if (!audioContext) {
        return;
      }

      if (
        audioContext.state ===
        "suspended"
      ) {
        audioContext.resume().catch(
          () => {}
        );
      }

      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      oscillator.type =
        notification?.type ===
        "quantity_change"
          ? "square"
          : "sine";

      oscillator.frequency.setValueAtTime(
        800,
        audioContext.currentTime
      );

      oscillator.frequency.setValueAtTime(
        1000,
        audioContext.currentTime +
          0.13
      );

      oscillator.frequency.setValueAtTime(
        700,
        audioContext.currentTime +
          0.26
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.25,
        audioContext.currentTime +
          0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          0.55
      );

      oscillator.connect(
        gainNode
      );

      gainNode.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime +
          0.55
      );
    } catch (error) {
      console.error(
        "CUSTOMER NOTIFICATION SOUND ERROR:",
        error
      );
    }
  }

  // =====================================================
  // تحميل المخزون
  // =====================================================

  async function loadProductStocks(
    loadedItems: Record<
      number,
      OrderItem[]
    >
  ) {
    const allItems: OrderItem[] =
      [];

    Object.values(
      loadedItems
    ).forEach(
      (
        items: OrderItem[]
      ) => {
        allItems.push(
          ...items
        );
      }
    );

    const productIds =
      Array.from(
        new Set(
          allItems.map(
            (
              item: OrderItem
            ) =>
              item.product_id
          )
        )
      );

    if (
      productIds.length ===
      0
    ) {
      setProductStocks(
        {}
      );

      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("products")
        .select(
          "id,stock"
        )
        .in(
          "id",
          productIds
        );

    if (error) {
      console.error(
        "LOAD PRODUCT STOCKS ERROR:",
        error
      );

      return;
    }

    const stockMap: Record<
      number,
      number
    > = {};

    (
      data || []
    ).forEach(
      (
        product: ProductStock
      ) => {
        stockMap[
          product.id
        ] =
          Number(
            product.stock
          );
      }
    );

    setProductStocks(
      stockMap
    );
  }

  // =====================================================
  // تحميل سلة المحذوفات
  // =====================================================

  async function loadTrashOrders(
    currentUserId?: string | null
  ) {
    const currentId =
      currentUserId ??
      userId;

    if (!currentId) {
      return;
    }

    setTrashLoading(
      true
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .select(
            "id,user_id,customer_name,phone,address,notes,total,status,created_at,hidden_from_customer"
          )
          .eq(
            "user_id",
            currentId
          )
          .eq(
            "hidden_from_customer",
            true
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error) {
        console.error(
          "LOAD CUSTOMER TRASH ERROR:",
          error
        );

        return;
      }

      setTrashOrders(
        (data || []) as Order[]
      );
    } finally {
      setTrashLoading(
        false
      );
    }
  }

  async function openTrash() {
    setTrashOpen(
      true
    );

    await loadTrashOrders(
      userId
    );
  }

  // =====================================================
  // تحميل البيانات
  // =====================================================

  async function loadAllData(
    currentUserId?: string | null,
    detectNew = false
  ) {
    try {
      const currentId =
        currentUserId ??
        userId;

      if (
        currentUserId !==
          undefined &&
        currentUserId !==
          null
      ) {
        setUserId(
          currentUserId
        );
      }

      const result =
        (await apiRequest(
          "load_all"
        )) as OrdersApiResponse;

      let visibleOrders =
        result.orders ||
        [];

      if (currentId) {
        const {
          data: hiddenOrders,
          error: hiddenError,
        } =
          await supabase
            .from("orders")
            .select(
              "id,hidden_from_customer"
            )
            .eq(
              "user_id",
              currentId
            );

        if (hiddenError) {
          console.error(
            "LOAD CUSTOMER HIDDEN FLAGS ERROR:",
            hiddenError
          );
        } else {
          const hiddenIds =
            new Set(
              (
                hiddenOrders ||
                []
              )
                .filter(
                  (
                    item: {
                      id: number;
                      hidden_from_customer:
                        | boolean
                        | null;
                    }
                  ) =>
                    item.hidden_from_customer
                )
                .map(
                  (
                    item: {
                      id: number;
                      hidden_from_customer:
                        | boolean
                        | null;
                    }
                  ) =>
                    Number(
                      item.id
                    )
                )
            );

          visibleOrders =
            visibleOrders.filter(
              (
                order: Order
              ) =>
                !hiddenIds.has(
                  order.id
                )
            );
        }
      }

      setOrders(
        visibleOrders
      );

      setOrderItems(
        result.orderItems ||
          {}
      );

      setQuantityChanges(
        result.quantityChanges ||
          []
      );

      const filteredNotifications =
        (
          result.notifications ||
          []
        ).filter(
          (
            notification: Notification
          ) =>
            !locallyDeletedNotificationIdsRef.current.has(
              notification.id
            )
        );

      if (detectNew) {
        const lastId =
          lastKnownNotificationIdRef.current;

        if (
          lastId !== null
        ) {
          const newNotifications =
            filteredNotifications
              .filter(
                (
                  notification: Notification
                ) =>
                  notification.id >
                  lastId
              )
              .sort(
                (
                  a: Notification,
                  b: Notification
                ) =>
                  a.id - b.id
              );

          for (
            const notification of
              newNotifications
          ) {
            if (
              !newNotificationIdsRef.current.has(
                notification.id
              )
            ) {
              newNotificationIdsRef.current.add(
                notification.id
              );

              setNotificationsOpen(
                true
              );

              playNotificationSound(
                notification
              );

              window.setTimeout(
                () => {
                  newNotificationIdsRef.current.delete(
                    notification.id
                  );
                },
                1000
              );
            }
          }
        }

        if (
          filteredNotifications[0]
        ) {
          lastKnownNotificationIdRef.current =
            Math.max(
              lastKnownNotificationIdRef.current ??
                0,
              filteredNotifications[0]
                .id
            );
        }
      } else if (
        lastKnownNotificationIdRef.current ===
        null
      ) {
        if (
          filteredNotifications[0]
        ) {
          lastKnownNotificationIdRef.current =
            filteredNotifications[0].id;
        }
      }

      setNotifications(
        filteredNotifications
      );

      await loadProductStocks(
        result.orderItems ||
          {}
      );

      await loadTrashOrders(
        currentId
      );
    } catch (error) {
      console.error(
        "LOAD ORDERS API ERROR:",
        error
      );

      throw error;
    }
  }

  // =====================================================
  // تحديث يدوي
  // =====================================================

  async function refreshOrders() {
    setRefreshing(
      true
    );

    try {
      await loadAllData(
        userId,
        true
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : t.unexpectedError
      );
    } finally {
      setRefreshing(
        false
      );
    }
  }

  // =====================================================
  // إيجاد تعديل معلق
  // =====================================================

  function getPendingChange(
    itemId: number
  ) {
    return quantityChanges.find(
      (
        change: QuantityChange
      ) =>
        change.order_item_id ===
          itemId &&
        change.status ===
          "pending"
    );
  }

  // =====================================================
  // هل يمكن تعديل الكمية؟
  // =====================================================

  function canCustomerEditQuantity(
    order: Order,
    item: OrderItem
  ) {
    const pendingChange =
      getPendingChange(
        item.id
      );

    return (
      order.status ===
        "جديد" &&
      !pendingChange
    );
  }

  // =====================================================
  // بدء التعديل
  // =====================================================

  function startQuantityEdit(
    item: OrderItem
  ) {
    setEditingItemId(
      item.id
    );

    setDraftQuantities(
      (
        current: Record<
          number,
          number
        >
      ) => ({
        ...current,
        [item.id]:
          Number(
            item.quantity
          ),
      })
    );
  }

  // =====================================================
  // إلغاء التعديل
  // =====================================================

  function cancelQuantityEdit(
    itemId: number
  ) {
    setEditingItemId(
      null
    );

    setDraftQuantities(
      (
        current: Record<
          number,
          number
        >
      ) => {
        const next =
          {
            ...current,
          };

        delete next[
          itemId
        ];

        return next;
      }
    );
  }

  // =====================================================
  // تغيير الكمية
  // =====================================================

  function changeDraftQuantity(
    item: OrderItem,
    newQuantity: number
  ) {
    const stock =
      productStocks[
        item.product_id
      ] ?? 0;

    if (
      newQuantity < 1
    ) {
      newQuantity =
        1;
    }

    if (
      stock > 0 &&
      newQuantity >
        stock
    ) {
      newQuantity =
        stock;
    }

    setDraftQuantities(
      (
        current: Record<
          number,
          number
        >
      ) => ({
        ...current,
        [item.id]:
          newQuantity,
      })
    );
  }

  // =====================================================
  // حفظ كمية العميل
  // =====================================================

  async function saveCustomerQuantity(
    order: Order,
    item: OrderItem
  ) {
    if (
      savingQuantityItemId ===
      item.id
    ) {
      return;
    }

    if (
      order.status !==
      "جديد"
    ) {
      alert(
        isArabic
          ? 'لا يمكن تعديل الكمية لأن حالة الطلب لم تعد "جديد".'
          : 'The quantity cannot be changed because the order status is no longer "New".'
      );

      return;
    }

    const pendingChange =
      getPendingChange(
        item.id
      );

    if (
      pendingChange
    ) {
      alert(
        isArabic
          ? "يوجد اقتراح كمية من الأدمن في انتظار الموافقة."
          : "There is an admin quantity suggestion waiting for your approval."
      );

      return;
    }

    const newQuantity =
      Number(
        draftQuantities[
          item.id
        ]
      );

    const stock =
      productStocks[
        item.product_id
      ] ?? 0;

    if (
      !Number.isInteger(
        newQuantity
      ) ||
      newQuantity < 1
    ) {
      alert(
        isArabic
          ? "من فضلك اختر كمية صحيحة."
          : "Please choose a valid quantity."
      );

      return;
    }

    if (
      stock > 0 &&
      newQuantity >
        stock
    ) {
      alert(
        isArabic
          ? `الكمية المطلوبة أكبر من المخزون الحالي.\n\nالمتاح: ${stock}`
          : `The requested quantity is greater than the current stock.\n\nAvailable: ${stock}`
      );

      return;
    }

    if (
      newQuantity ===
      Number(
        item.quantity
      )
    ) {
      cancelQuantityEdit(
        item.id
      );

      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? `هل تريد تغيير كمية "${item.product_name}" من ${item.quantity} إلى ${newQuantity}؟`
          : `Do you want to change the quantity of "${item.product_name}" from ${item.quantity} to ${newQuantity}?`
      );

    if (!confirmed) {
      return;
    }

    setSavingQuantityItemId(
      item.id
    );

    try {
      await apiRequest(
        "update_order_item_quantity",
        {
          orderId:
            order.id,
          orderItemId:
            item.id,
          productId:
            item.product_id,
          quantity:
            newQuantity,
        }
      );

      await loadAllData(
        userId,
        false
      );

      setEditingItemId(
        null
      );

      setDraftQuantities(
        (
          current: Record<
            number,
            number
          >
        ) => {
          const next =
            {
              ...current,
            };

          delete next[
            item.id
          ];

          return next;
        }
      );

      alert(
        isArabic
          ? `تم تعديل الكمية بنجاح ✅\n\nالكمية الجديدة: ${newQuantity}`
          : `Quantity updated successfully ✅\n\nNew quantity: ${newQuantity}`
      );
    } catch (error) {
      console.error(
        "UPDATE CUSTOMER QUANTITY ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : isArabic
            ? "حدث خطأ أثناء تعديل الكمية."
            : "An error occurred while changing the quantity."
      );
    } finally {
      setSavingQuantityItemId(
        null
      );
    }
  }

  // =====================================================
  // الرد على اقتراح الأدمن
  // =====================================================

  async function respondToQuantityChange(
    item: OrderItem,
    change: QuantityChange,
    approved: boolean
  ) {
    if (!userId) {
      alert(
        isArabic
          ? "يجب تسجيل الدخول أولاً."
          : "You must log in first."
      );

      return;
    }

    if (
      approvalId ===
      item.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        approved
          ? isArabic
            ? `هل توافق على تعديل كمية "${item.product_name}" من ${change.old_quantity} إلى ${change.new_quantity}؟`
            : `Do you approve changing "${item.product_name}" from ${change.old_quantity} to ${change.new_quantity}?`
          : isArabic
            ? `هل أنت متأكد أنك تريد رفض تعديل كمية "${item.product_name}"؟`
            : `Are you sure you want to reject the quantity change for "${item.product_name}"?`
      );

    if (!confirmed) {
      return;
    }

    setApprovalId(
      item.id
    );

    try {
      await apiRequest(
        "respond_quantity_change",
        {
          changeId:
            change.id,
          orderId:
            change.order_id,
          orderItemId:
            change.order_item_id,
          approved,
        }
      );

      await loadAllData(
        userId,
        false
      );

      if (approved) {
        alert(
          isArabic
            ? `تمت الموافقة بنجاح ✅\n\nالكمية الجديدة: ${change.new_quantity}`
            : `Approved successfully ✅\n\nNew quantity: ${change.new_quantity}`
        );
      } else {
        alert(
          isArabic
            ? `تم رفض التعديل ❌\n\nتم الاحتفاظ بالكمية الأصلية: ${change.old_quantity}`
            : `Quantity change rejected ❌\n\nOriginal quantity kept: ${change.old_quantity}`
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
          : isArabic
            ? "حدث خطأ أثناء إرسال ردك."
            : "An error occurred while sending your response."
      );
    } finally {
      setApprovalId(
        null
      );
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
        isArabic
          ? "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟"
          : "Are you sure you want to cancel this order?"
      );

    if (!confirmed) {
      return;
    }

    setCancelingId(
      orderId
    );

    try {
      const result =
        (await apiRequest(
          "cancel_order",
          {
            orderId,
          }
        )) as {
          success?: boolean;
          message?: string;
        };

      if (
        result?.success !==
        true
      ) {
        alert(
          result?.message ||
            (
              isArabic
                ? "لا يمكن إلغاء الطلب الآن."
                : "This order cannot be cancelled now."
            )
        );

        return;
      }

      setOrders(
        (
          current: Order[]
        ) =>
          current.map(
            (
              order: Order
            ) =>
              order.id ===
              orderId
                ? {
                    ...order,
                    status:
                      "ملغي",
                  }
                : order
          )
      );

      alert(
        result?.message ||
          (
            isArabic
              ? "تم إلغاء الطلب بنجاح ✅"
              : "Order cancelled successfully ✅"
          )
      );

      await loadAllData(
        userId,
        false
      );
    } catch (error) {
      console.error(
        "CANCEL ORDER ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : isArabic
            ? "حدث خطأ أثناء إلغاء الطلب."
            : "An error occurred while cancelling the order."
      );
    } finally {
      setCancelingId(
        null
      );
    }
  }

  // =====================================================
  // قراءة إشعار
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
        (
          current: Notification[]
        ) =>
          current.map(
            (
              notification: Notification
            ) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read:
                      true,
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
          : isArabic
            ? "حدث خطأ أثناء تحديث الإشعار."
            : "An error occurred while updating the notification."
      );
    }
  }

  // =====================================================
  // قراءة الكل
  // =====================================================

  async function markAllNotificationsAsRead() {
    if (!userId) {
      return;
    }

    const unreadIds =
      notifications
        .filter(
          (
            notification: Notification
          ) =>
            !notification.is_read
        )
        .map(
          (
            notification: Notification
          ) =>
            notification.id
        );

    if (
      unreadIds.length ===
      0
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from("notifications")
        .update({
          is_read:
            true,
        })
        .in(
          "id",
          unreadIds
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      alert(
        isArabic
          ? "حدث خطأ أثناء تعليم الإشعارات كمقروءة."
          : "An error occurred while marking notifications as read."
      );

      return;
    }

    setNotifications(
      (
        current: Notification[]
      ) =>
        current.map(
          (
            notification: Notification
          ) => ({
            ...notification,
            is_read:
              true,
          })
        )
    );
  }

  // =====================================================
  // حذف إشعار
  // =====================================================

  async function deleteNotification(
    notificationId: number
  ) {
    if (
      deletingNotificationId !==
        null ||
      !userId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? "هل تريد حذف هذا الإشعار؟"
          : "Do you want to delete this notification?"
      );

    if (!confirmed) {
      return;
    }

    setDeletingNotificationId(
      notificationId
    );

    locallyDeletedNotificationIdsRef.current.add(
      notificationId
    );

    setNotifications(
      (
        current: Notification[]
      ) =>
        current.filter(
          (
            notification: Notification
          ) =>
            notification.id !==
            notificationId
        )
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "notifications"
          )
          .delete()
          .eq(
            "id",
            notificationId
          )
          .eq(
            "user_id",
            userId
          )
          .select(
            "id"
          );

      if (error) {
        locallyDeletedNotificationIdsRef.current.delete(
          notificationId
        );

        alert(
          isArabic
            ? "فشل حذف الإشعار:\n" +
                error.message
            : "Failed to delete notification:\n" +
                error.message
        );

        return;
      }

      if (
        !data ||
        data.length ===
          0
      ) {
        locallyDeletedNotificationIdsRef.current.delete(
          notificationId
        );

        alert(
          isArabic
            ? "لم يتم حذف الإشعار. تأكد من صلاحيات الحذف في Supabase."
            : "The notification was not deleted. Check delete permissions in Supabase."
        );

        return;
      }
    } catch (error) {
      locallyDeletedNotificationIdsRef.current.delete(
        notificationId
      );

      console.error(
        "DELETE NOTIFICATION ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : isArabic
            ? "حدث خطأ أثناء حذف الإشعار."
            : "An error occurred while deleting the notification."
      );
    } finally {
      setDeletingNotificationId(
        null
      );
    }
  }

  // =====================================================
  // حذف كل الإشعارات
  // =====================================================

  async function deleteAllNotifications() {
    if (
      deletingAllNotifications ||
      !userId ||
      !notifications.length
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? `هل تريد حذف كل الإشعارات وعددها ${notifications.length}؟`
          : `Do you want to delete all ${notifications.length} notifications?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingAllNotifications(
      true
    );

    const ids =
      notifications.map(
        (
          notification: Notification
        ) =>
          notification.id
      );

    ids.forEach(
      (id: number) =>
        locallyDeletedNotificationIdsRef.current.add(
          id
        )
    );

    setNotifications(
      []
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "notifications"
          )
          .delete()
          .eq(
            "user_id",
            userId
          )
          .select(
            "id"
          );

      if (error) {
        ids.forEach(
          (id: number) =>
            locallyDeletedNotificationIdsRef.current.delete(
              id
            )
        );

        alert(
          isArabic
            ? "فشل حذف كل الإشعارات:\n" +
                error.message
            : "Failed to delete all notifications:\n" +
                error.message
        );

        return;
      }

      if (
        !data ||
        data.length ===
          0
      ) {
        ids.forEach(
          (id: number) =>
            locallyDeletedNotificationIdsRef.current.delete(
              id
            )
        );

        alert(
          isArabic
            ? "لم يتم حذف الإشعارات. تأكد من صلاحيات الحذف في Supabase."
            : "The notifications were not deleted. Check delete permissions in Supabase."
        );
      }
    } finally {
      setDeletingAllNotifications(
        false
      );
    }
  }

  // =====================================================
  // حذف طلب
  // =====================================================

  async function hideSingleOrder(
    order: Order
  ) {
    if (
      hidingOrderId !==
        null ||
      hidingAll ||
      hidingStatus !==
        null ||
      !userId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? `هل تريد نقل الطلب رقم ${order.id} إلى سلة المحذوفات؟\n\nسيظل الطلب موجودًا عند الأدمن.`
          : `Do you want to move order #${order.id} to the trash?\n\nThe order will remain visible to the admin.`
      );

    if (!confirmed) {
      return;
    }

    setHidingOrderId(
      order.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .update({
            hidden_from_customer:
              true,
          })
          .eq(
            "id",
            order.id
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "hidden_from_customer",
            false
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          isArabic
            ? "فشل نقل الطلب إلى سلة المحذوفات:\n" +
                error.message
            : "Failed to move the order to trash:\n" +
                error.message
        );

        return;
      }

      if (
        !data ||
        data.length ===
          0
      ) {
        alert(
          isArabic
            ? "لم يتم نقل الطلب إلى سلة المحذوفات."
            : "The order was not moved to trash."
        );

        return;
      }

      setOrders(
        (
          current: Order[]
        ) =>
          current.filter(
            (
              item: Order
            ) =>
              item.id !==
              order.id
          )
      );

      setTrashOrders(
        (
          current: Order[]
        ) => [
          {
            ...order,
            hidden_from_customer:
              true,
          },
          ...current.filter(
            (
              item: Order
            ) =>
              item.id !==
              order.id
          ),
        ]
      );
    } finally {
      setHidingOrderId(
        null
      );
    }
  }

  // =====================================================
  // حذف حسب الحالة
  // =====================================================

  async function hideOrdersByStatus(
    status: string
  ) {
    if (
      hidingOrderId !==
        null ||
      hidingAll ||
      hidingStatus !==
        null ||
      !userId
    ) {
      return;
    }

    const matchingOrders =
      orders.filter(
        (
          order: Order
        ) =>
          order.status ===
          status
      );

    if (
      matchingOrders.length ===
      0
    ) {
      alert(
        isArabic
          ? `لا توجد طلبات بحالة "${getStatusLabel(status)}".`
          : `There are no orders with status "${getStatusLabel(status)}".`
      );

      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? `سيتم نقل ${matchingOrders.length} طلب/طلبات بحالة "${getStatusLabel(status)}" إلى سلة المحذوفات.\n\nستظل موجودة عند الأدمن.\n\nهل تريد المتابعة؟`
          : `${matchingOrders.length} order(s) with status "${getStatusLabel(status)}" will be moved to trash.\n\nThey will remain visible to the admin.\n\nContinue?`
      );

    if (!confirmed) {
      return;
    }

    setHidingStatus(
      status
    );

    try {
      const ids =
        matchingOrders.map(
          (
            order: Order
          ) =>
            order.id
        );

      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .update({
            hidden_from_customer:
              true,
          })
          .in(
            "id",
            ids
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "hidden_from_customer",
            false
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          isArabic
            ? "فشل نقل الطلبات:\n" +
                error.message
            : "Failed to move the orders:\n" +
                error.message
        );

        return;
      }

      const updatedIds =
        (
          data || []
        ).map(
          (
            item: {
              id: number;
            }
          ) =>
            item.id
        );

      const movedOrders =
        matchingOrders.filter(
          (
            order: Order
          ) =>
            updatedIds.includes(
              order.id
            )
        );

      setOrders(
        (
          current: Order[]
        ) =>
          current.filter(
            (
              order: Order
            ) =>
              !updatedIds.includes(
                order.id
              )
          )
      );

      setTrashOrders(
        (
          current: Order[]
        ) => [
          ...movedOrders.map(
            (
              order: Order
            ) => ({
              ...order,
              hidden_from_customer:
                true,
            })
          ),
          ...current.filter(
            (
              order: Order
            ) =>
              !updatedIds.includes(
                order.id
              )
          ),
        ]
      );
    } finally {
      setHidingStatus(
        null
      );
    }
  }

  // =====================================================
  // حذف الكل
  // =====================================================

  async function hideAllOrders() {
    if (
      hidingOrderId !==
        null ||
      hidingAll ||
      hidingStatus !==
        null ||
      orders.length ===
        0 ||
      !userId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? `سيتم نقل جميع الطلبات الموجودة لديك وعددها ${orders.length} إلى سلة المحذوفات.\n\nستظل موجودة عند الأدمن.\n\nهل تريد المتابعة؟`
          : `All ${orders.length} of your orders will be moved to trash.\n\nThey will remain visible to the admin.\n\nContinue?`
      );

    if (!confirmed) {
      return;
    }

    setHidingAll(
      true
    );

    try {
      const ids =
        orders.map(
          (
            order: Order
          ) =>
            order.id
        );

      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .update({
            hidden_from_customer:
              true,
          })
          .in(
            "id",
            ids
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "hidden_from_customer",
            false
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          isArabic
            ? "فشل نقل كل الطلبات:\n" +
                error.message
            : "Failed to move all orders:\n" +
                error.message
        );

        return;
      }

      const updatedIds =
        (
          data || []
        ).map(
          (
            item: {
              id: number;
            }
          ) =>
            item.id
        );

      const movedOrders =
        orders.filter(
          (
            order: Order
          ) =>
            updatedIds.includes(
              order.id
            )
        );

      setTrashOrders(
        (
          current: Order[]
        ) => [
          ...movedOrders.map(
            (
              order: Order
            ) => ({
              ...order,
              hidden_from_customer:
                true,
            })
          ),
          ...current,
        ]
      );

      setOrders(
        (
          current: Order[]
        ) =>
          current.filter(
            (
              order: Order
            ) =>
              !updatedIds.includes(
                order.id
              )
          )
      );
    } finally {
      setHidingAll(
        false
      );
    }
  }

  // =====================================================
  // استرجاع طلب
  // =====================================================

  async function restoreOrder(
    order: Order
  ) {
    if (
      restoringOrderId !==
        null ||
      restoringAll ||
      !userId
    ) {
      return;
    }

    setRestoringOrderId(
      order.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .update({
            hidden_from_customer:
              false,
          })
          .eq(
            "id",
            order.id
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "hidden_from_customer",
            true
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          isArabic
            ? "فشل استرجاع الطلب:\n" +
                error.message
            : "Failed to restore the order:\n" +
                error.message
        );

        return;
      }

      if (
        !data ||
        data.length ===
          0
      ) {
        alert(
          isArabic
            ? "لم يتم استرجاع الطلب."
            : "The order was not restored."
        );

        return;
      }

      const restoredOrder =
        {
          ...order,
          hidden_from_customer:
            false,
        };

      setTrashOrders(
        (
          current: Order[]
        ) =>
          current.filter(
            (
              item: Order
            ) =>
              item.id !==
              order.id
          )
      );

      setOrders(
        (
          current: Order[]
        ) =>
          current.some(
            (
              item: Order
            ) =>
              item.id ===
              order.id
          )
            ? current
            : [
                restoredOrder,
                ...current,
              ]
      );
    } finally {
      setRestoringOrderId(
        null
      );
    }
  }

  // =====================================================
  // استرجاع الكل
  // =====================================================

  async function restoreAllOrders() {
    if (
      restoringAll ||
      restoringOrderId !==
        null ||
      trashOrders.length ===
        0 ||
      !userId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        isArabic
          ? `هل تريد استرجاع كل الطلبات الموجودة في سلة المحذوفات وعددها ${trashOrders.length}؟`
          : `Do you want to restore all ${trashOrders.length} orders in the trash?`
      );

    if (!confirmed) {
      return;
    }

    setRestoringAll(
      true
    );

    try {
      const ids =
        trashOrders.map(
          (
            order: Order
          ) =>
            order.id
        );

      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .update({
            hidden_from_customer:
              false,
          })
          .in(
            "id",
            ids
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "hidden_from_customer",
            true
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          isArabic
            ? "فشل استرجاع الطلبات:\n" +
                error.message
            : "Failed to restore the orders:\n" +
                error.message
        );

        return;
      }

      const restoredIds =
        (
          data || []
        ).map(
          (
            item: {
              id: number;
            }
          ) =>
            item.id
        );

      const restoredOrders =
        trashOrders
          .filter(
            (
              order: Order
            ) =>
              restoredIds.includes(
                order.id
              )
          )
          .map(
            (
              order: Order
            ) => ({
              ...order,
              hidden_from_customer:
                false,
            })
          );

      setOrders(
        (
          current: Order[]
        ) => [
          ...restoredOrders,
          ...current.filter(
            (
              existing: Order
            ) =>
              !restoredIds.includes(
                existing.id
              )
          ),
        ]
      );

      setTrashOrders(
        (
          current: Order[]
        ) =>
          current.filter(
            (
              order: Order
            ) =>
              !restoredIds.includes(
                order.id
              )
          )
      );
    } finally {
      setRestoringAll(
        false
      );
    }
  }

  // =====================================================
  // تشغيل الصفحة
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function start() {
      setLoading(
        true
      );

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
          setTrashOrders([]);
          setOrderItems({});
          setQuantityChanges([]);
          setNotifications([]);
          setProductStocks({});
          setLoading(
            false
          );

          return;
        }

        setUserId(
          user.id
        );

        await loadAllData(
          user.id,
          false
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
              : t.loadError
          );
        }
      } finally {
        if (mounted) {
          setLoading(
            false
          );
        }
      }
    }

    start();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // التحديث التلقائي بدون إفساد تعديل الكمية
  // =====================================================

  useEffect(() => {
    if (!userId) {
      return;
    }

    const interval =
      window.setInterval(
        async () => {
          if (
            editingItemIdRef.current !==
              null ||
            savingQuantityItemIdRef.current !==
              null
          ) {
            return;
          }

          try {
            await loadAllData(
              userId,
              true
            );
          } catch (error) {
            console.error(
              "CUSTOMER AUTO REFRESH ERROR:",
              error
            );
          }
        },
        4000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [userId]);

  // =====================================================
  // Realtime
  // =====================================================

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel =
      supabase.channel(
        `customer-orders-live-${userId}`
      );

    const realtimeChannel =
      channel as any;

    realtimeChannel
      .on(
        "postgres_changes",
        {
          event:
            "INSERT",
          schema:
            "public",
          table:
            "notifications",
          filter:
            `user_id=eq.${userId}`,
        },
        async (
          payload: RealtimeNotificationPayload
        ) => {
          const notification =
            payload.new;

          if (
            locallyDeletedNotificationIdsRef.current.has(
              notification.id
            )
          ) {
            return;
          }

          setNotifications(
            (
              current: Notification[]
            ) => {
              if (
                current.some(
                  (
                    item: Notification
                  ) =>
                    item.id ===
                    notification.id
                )
              ) {
                return current;
              }

              return [
                notification,
                ...current,
              ];
            }
          );

          if (
            !newNotificationIdsRef.current.has(
              notification.id
            )
          ) {
            newNotificationIdsRef.current.add(
              notification.id
            );

            lastKnownNotificationIdRef.current =
              Math.max(
                lastKnownNotificationIdRef.current ??
                  0,
                notification.id
              );

            setNotificationsOpen(
              true
            );

            playNotificationSound(
              notification
            );

            window.setTimeout(
              () => {
                newNotificationIdsRef.current.delete(
                  notification.id
                );
              },
              1000
            );
          }

          if (
            notification.type ===
            "quantity_change"
          ) {
            await loadAllData(
              userId,
              false
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "UPDATE",
          schema:
            "public",
          table:
            "notifications",
          filter:
            `user_id=eq.${userId}`,
        },
        async (
          payload: RealtimeNotificationPayload
        ) => {
          if (
            locallyDeletedNotificationIdsRef.current.has(
              payload.new.id
            )
          ) {
            return;
          }

          setNotifications(
            (
              current: Notification[]
            ) =>
              current.map(
                (
                  notification: Notification
                ) =>
                  notification.id ===
                  payload.new.id
                    ? payload.new
                    : notification
              )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "DELETE",
          schema:
            "public",
          table:
            "notifications",
          filter:
            `user_id=eq.${userId}`,
        },
        async (
          payload: RealtimeNotificationPayload
        ) => {
          const deletedId =
            payload.old?.id ??
            payload.new?.id;

          if (
            typeof deletedId ===
            "number"
          ) {
            setNotifications(
              (
                current: Notification[]
              ) =>
                current.filter(
                  (
                    notification: Notification
                  ) =>
                    notification.id !==
                    deletedId
                )
            );

            locallyDeletedNotificationIdsRef.current.add(
              deletedId
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "UPDATE",
          schema:
            "public",
          table:
            "orders",
          filter:
            `user_id=eq.${userId}`,
        },
        async () => {
          if (
            editingItemIdRef.current !==
            null
          ) {
            return;
          }

          if (
            realtimeLoadingRef.current
          ) {
            return;
          }

          realtimeLoadingRef.current =
            true;

          try {
            await loadAllData(
              userId,
              true
            );
          } catch (error) {
            console.error(
              "REALTIME ORDER UPDATE ERROR:",
              error
            );
          } finally {
            realtimeLoadingRef.current =
              false;
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "order_items",
        },
        async () => {
          if (
            editingItemIdRef.current !==
            null
          ) {
            return;
          }

          try {
            await loadAllData(
              userId,
              false
            );
          } catch (error) {
            console.error(
              "REALTIME ORDER ITEM ERROR:",
              error
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "order_quantity_changes",
        },
        async () => {
          try {
            await loadAllData(
              userId,
              false
            );
          } catch (error) {
            console.error(
              "REALTIME QUANTITY ERROR:",
              error
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "products",
        },
        async () => {
          try {
            await loadProductStocks(
              orderItems
            );
          } catch (error) {
            console.error(
              "REALTIME PRODUCTS ERROR:",
              error
            );
          }
        }
      );

    realtimeChannel.subscribe(
      (
        status: string
      ) => {
        console.log(
          "CUSTOMER REALTIME STATUS:",
          status
        );
      }
    );

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [userId]);

  // =====================================================
  // تسجيل الخروج
  // =====================================================

  async function handleLogout() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      alert(
        isArabic
          ? "حدث خطأ أثناء تسجيل الخروج"
          : "An error occurred while signing out."
      );

      return;
    }

    setUserId(null);
    setOrders([]);
    setTrashOrders([]);
    setOrderItems({});
    setQuantityChanges([]);
    setNotifications([]);
    setProductStocks({});
    setNotificationsOpen(
      false
    );

    lastKnownNotificationIdRef.current =
      null;

    locallyDeletedNotificationIdsRef.current.clear();

    newNotificationIdsRef.current.clear();

    alert(
      isArabic
        ? "تم تسجيل الخروج بنجاح 👋"
        : "You have been signed out successfully 👋"
    );
  }

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <main
        dir={dir}
        className="relative flex min-h-screen items-center justify-center bg-gray-50 px-6"
      >
        <button
          type="button"
          onClick={
            toggleLanguage
          }
          className="absolute left-4 top-4 rounded-xl border border-green-600 bg-white px-4 py-2 font-bold text-green-700 shadow-sm sm:left-6 sm:top-6"
        >
          🌐 {t.languageButton}
        </button>

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            📦
          </div>

          <h1 className="mt-4 text-2xl font-bold text-green-700">
            {t.myOrders}
          </h1>

          <p className="mt-4 text-lg font-bold text-gray-700">
            {t.loadingOrders}
          </p>

          <p className="mt-2 text-sm text-gray-400">
            {t.pleaseWait}
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
        dir={dir}
        className="relative flex min-h-screen items-center justify-center bg-gray-50 p-6"
      >
        <button
          type="button"
          onClick={
            toggleLanguage
          }
          className="absolute left-4 top-4 rounded-xl border border-green-600 bg-white px-4 py-2 font-bold text-green-700 shadow-sm sm:left-6 sm:top-6"
        >
          🌐 {t.languageButton}
        </button>

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            🔐
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-800">
            {t.loginRequired}
          </h1>

          <p className="mt-3 text-gray-500">
            {t.loginRequiredText}
          </p>

          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
          >
            {t.login}
          </a>
        </div>
      </main>
    );
  }

  const unreadNotifications =
    notifications.filter(
      (
        notification: Notification
      ) =>
        !notification.is_read
    );

  return (
    <main
      dir={dir}
      className="min-h-screen bg-gray-50"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              {t.myOrders}
            </h1>

            <p className="text-sm text-gray-500">
              {t.pharmacyName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* اللغة */}

            <button
              type="button"
              onClick={
                toggleLanguage
              }
              className="rounded-xl border border-purple-600 bg-white px-4 py-2.5 font-bold text-purple-700"
            >
              🌐 {t.languageButton}
            </button>

            <button
              type="button"
              onClick={
                enableNotificationSound
              }
              className={`rounded-xl px-4 py-2.5 font-bold ${
                soundEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-500 text-white"
              }`}
            >
              {soundEnabled
                ? t.soundEnabled
                : t.notificationSound}
            </button>

            <button
              type="button"
              onClick={() =>
                setNotificationsOpen(
                  true
                )
              }
              className="relative rounded-xl border border-blue-600 bg-blue-50 px-4 py-2.5 font-bold text-blue-700"
            >
              {t.notifications}

              {unreadNotifications.length >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
                  {
                    unreadNotifications.length
                  }
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openTrash}
              className="rounded-xl border border-red-600 bg-red-50 px-4 py-2.5 font-bold text-red-700"
            >
              {t.trash}
            </button>

            <a
              href="/"
              className="rounded-xl border border-green-600 px-4 py-2.5 font-bold text-green-700"
            >
              {t.home}
            </a>

            <button
              type="button"
              onClick={
                refreshOrders
              }
              disabled={
                refreshing
              }
              className="rounded-xl bg-green-600 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {refreshing
                ? t.refreshing
                : t.refresh}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* =====================================================
            إدارة الطلبات
        ===================================================== */}

        <div className="mb-8 rounded-2xl border-2 border-red-200 bg-red-50 p-5">
          <h2 className="text-xl font-bold text-red-700">
            {t.ordersManagement}
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {t.ordersManagementText}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statusOptions.map(
              (
                status: {
                  value: string;
                }
              ) => {
                const count =
                  orders.filter(
                    (
                      order: Order
                    ) =>
                      order.status ===
                      status.value
                  ).length;

                return (
                  <button
                    key={
                      status.value
                    }
                    type="button"
                    onClick={() =>
                      hideOrdersByStatus(
                        status.value
                      )
                    }
                    disabled={
                      count ===
                        0 ||
                      hidingOrderId !==
                        null ||
                      hidingAll ||
                      hidingStatus !==
                        null
                    }
                    className="flex items-center justify-between rounded-xl border border-red-300 bg-white px-4 py-3 font-bold text-red-700 disabled:opacity-50"
                  >
                    <span>
                      {t.deleteStatus}{" "}
                      {getStatusLabel(
                        status.value
                      )}
                    </span>

                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm">
                      {
                        count
                      }
                    </span>
                  </button>
                );
              }
            )}

            <button
              type="button"
              onClick={
                hideAllOrders
              }
              disabled={
                !orders.length ||
                hidingOrderId !==
                  null ||
                hidingAll ||
                hidingStatus !==
                  null
              }
              className="rounded-xl bg-red-600 px-4 py-3 font-black text-white disabled:opacity-50"
            >
              {t.deleteAllOrders} (
              {
                orders.length
              })
            </button>
          </div>
        </div>

        {/* =====================================================
            الطلبات
        ===================================================== */}

        {orders.length ===
        0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">
              📦
            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-700">
              {t.noOrders}
            </h2>

            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
            >
              {t.browseProducts}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(
              (
                order: Order
              ) => {
                const isCancelled =
                  order.status ===
                  "ملغي";

                const items =
                  orderItems[
                    order.id
                  ] || [];

                return (
                  <div
                    key={
                      order.id
                    }
                    className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            📦
                          </span>

                          <div>
                            <h2 className="text-xl font-bold text-gray-800">
                              {t.orderNumber}{" "}
                              {
                                order.id
                              }
                            </h2>

                            <p className="text-sm text-gray-500">
                              {new Date(
                                order.created_at
                              ).toLocaleString(
                                isArabic
                                  ? "ar-EG"
                                  : "en-US"
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-2 text-gray-700">
                          <p>
                            📞{" "}
                            <strong>
                              {t.phone}:
                            </strong>{" "}
                            {
                              order.phone
                            }
                          </p>

                          <p>
                            📍{" "}
                            <strong>
                              {t.address}:
                            </strong>{" "}
                            {
                              order.address
                            }
                          </p>

                          {order.notes && (
                            <p>
                              📝{" "}
                              <strong>
                                {t.notes}:
                              </strong>{" "}
                              {
                                order.notes
                              }
                            </p>
                          )}

                          <p>
                            💰{" "}
                            <strong>
                              {t.total}:
                            </strong>{" "}
                            {
                              order.total
                            }{" "}
                            {isArabic
                              ? "جنيه"
                              : "EGP"}
                          </p>
                        </div>

                        {!isCancelled &&
                          (
                            order.status ===
                              "جديد" ||
                            order.status ===
                              "pending"
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                cancelOrder(
                                  order.id
                                )
                              }
                              disabled={
                                cancelingId ===
                                order.id
                              }
                              className="mt-6 rounded-xl bg-red-600 px-6 py-3 font-bold text-white disabled:opacity-60"
                            >
                              {cancelingId ===
                              order.id
                                ? t.canceling
                                : t.cancelOrder}
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() =>
                            hideSingleOrder(
                              order
                            )
                          }
                          disabled={
                            hidingOrderId ===
                              order.id ||
                            hidingAll ||
                            hidingStatus !==
                              null
                          }
                          className="mr-2 mt-6 rounded-xl border border-red-500 bg-red-50 px-6 py-3 font-bold text-red-600 disabled:opacity-50"
                        >
                          {hidingOrderId ===
                          order.id
                            ? t.moving
                            : t.hideFromOrders}
                        </button>
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
                          {t.status}
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {
                            getStatusLabel(
                              order.status
                            )
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 border-t pt-6">
                      <h3 className="mb-5 text-xl font-bold text-gray-800">
                        {t.orderProducts}
                      </h3>

                      <div className="space-y-5">
                        {items.map(
                          (
                            item: OrderItem
                          ) => {
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

                            const canEdit =
                              canCustomerEditQuantity(
                                order,
                                item
                              );

                            const isEditing =
                              editingItemId ===
                              item.id;

                            const isSaving =
                              savingQuantityItemId ===
                              item.id;

                            const stock =
                              productStocks[
                                item.product_id
                              ] ?? 0;

                            const draftQuantity =
                              draftQuantities[
                                item.id
                              ] ??
                              item.quantity;

                            return (
                              <div
                                key={
                                  item.id
                                }
                                className="rounded-2xl border-2 border-gray-200 p-5"
                              >
                                <h4 className="text-xl font-bold text-gray-800">
                                  💊{" "}
                                  {
                                    item.product_name
                                  }
                                </h4>

                                <p className="mt-1 text-sm text-gray-500">
                                  {t.unitPrice}:{" "}
                                  {
                                    item.price
                                  }{" "}
                                  {isArabic
                                    ? "جنيه"
                                    : "EGP"}
                                </p>

                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                                    <p className="font-bold text-blue-600">
                                      {t.requestedQuantity}
                                    </p>

                                    <p className="text-3xl font-black text-blue-700">
                                      {
                                        item.requested_quantity
                                      }
                                    </p>
                                  </div>

                                  <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
                                    <p className="font-bold text-green-600">
                                      {t.currentQuantity}
                                    </p>

                                    <p className="text-3xl font-black text-green-700">
                                      {
                                        item.quantity
                                      }
                                    </p>
                                  </div>

                                  {hasPending &&
                                    pendingChange && (
                                      <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
                                        <p className="font-bold text-orange-600">
                                          {t.adminSuggestion}
                                        </p>

                                        <p className="text-3xl font-black text-orange-700">
                                          {
                                            pendingChange.new_quantity
                                          }
                                        </p>
                                      </div>
                                    )}
                                </div>

                                {canEdit && (
                                  <div className="mt-5 rounded-xl border-2 border-green-200 bg-green-50 p-5">
                                    {!isEditing ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          startQuantityEdit(
                                            item
                                          )
                                        }
                                        className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
                                      >
                                        {t.editQuantity}
                                      </button>
                                    ) : (
                                      <div className="max-w-sm">
                                        <div className="flex items-center justify-center gap-4">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              changeDraftQuantity(
                                                item,
                                                draftQuantity -
                                                  1
                                              )
                                            }
                                            disabled={
                                              draftQuantity <=
                                                1 ||
                                              isSaving
                                            }
                                            className="h-12 w-12 rounded-xl bg-gray-200 text-2xl font-black text-gray-900"
                                          >
                                            −
                                          </button>

                                          <input
                                            type="number"
                                            min={
                                              1
                                            }
                                            max={
                                              stock ||
                                              undefined
                                            }
                                            value={
                                              draftQuantity
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              changeDraftQuantity(
                                                item,
                                                Number(
                                                  e
                                                    .target
                                                    .value
                                                )
                                              )
                                            }
                                            disabled={
                                              isSaving
                                            }
                                            className="w-28 rounded-xl border-2 border-green-300 px-3 py-3 text-center text-xl font-black text-gray-900"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              changeDraftQuantity(
                                                item,
                                                draftQuantity +
                                                  1
                                              )
                                            }
                                            disabled={
                                              (
                                                stock >
                                                0 &&
                                                draftQuantity >=
                                                  stock
                                              ) ||
                                              isSaving
                                            }
                                            className="h-12 w-12 rounded-xl bg-green-600 text-2xl font-black text-white"
                                          >
                                            +
                                          </button>
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              saveCustomerQuantity(
                                                order,
                                                item
                                              )
                                            }
                                            disabled={
                                              isSaving
                                            }
                                            className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-60"
                                          >
                                            {isSaving
                                              ? t.saving
                                              : t.save}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              cancelQuantityEdit(
                                                item.id
                                              )
                                            }
                                            disabled={
                                              isSaving
                                            }
                                            className="flex-1 rounded-xl border bg-white px-4 py-3 font-bold text-gray-900 disabled:opacity-60"
                                          >
                                            {t.cancel}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!canEdit &&
                                  !isCancelled &&
                                  !hasPending &&
                                  order.status !==
                                    "جديد" && (
                                    <div className="mt-5 rounded-xl bg-gray-100 p-4 text-center">
                                      <p className="font-bold text-gray-600">
                                        {t.quantityUnavailable}
                                      </p>

                                      <p className="mt-1 text-sm text-gray-500">
                                        {
                                          t.quantityUnavailableText
                                        }
                                      </p>
                                    </div>
                                  )}

                                {hasPending &&
                                  pendingChange && (
                                    <div className="mt-5 rounded-xl border-2 border-orange-300 bg-orange-50 p-5">
                                      <h4 className="font-bold text-orange-800">
                                        {t.adminQuantityChange}
                                      </h4>

                                      <p className="mt-2 text-gray-700">
                                        {item.approval_message ||
                                          (
                                            isArabic
                                              ? `الأدمن يقترح تعديل الكمية من ${pendingChange.old_quantity} إلى ${pendingChange.new_quantity}.`
                                              : `The admin suggests changing the quantity from ${pendingChange.old_quantity} to ${pendingChange.new_quantity}.`
                                          )}
                                      </p>

                                      <div className="mt-4 rounded-xl bg-white p-4 text-center">
                                        <p className="text-sm text-gray-500">
                                          {
                                            t.originalQuantity
                                          }
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
                                          {
                                            t.proposedQuantity
                                          }
                                        </p>

                                        <p className="text-3xl font-black text-orange-600">
                                          {
                                            pendingChange.new_quantity
                                          }
                                        </p>
                                      </div>

                                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <button
                                          type="button"
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
                                          className="flex-1 rounded-xl bg-green-600 px-6 py-4 font-bold text-white disabled:opacity-60"
                                        >
                                          {approvalId ===
                                          item.id
                                            ? t.executing
                                            : t.approve}
                                        </button>

                                        <button
                                          type="button"
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
                                          className="flex-1 rounded-xl bg-red-600 px-6 py-4 font-bold text-white disabled:opacity-60"
                                        >
                                          {approvalId ===
                                          item.id
                                            ? t.executing
                                            : t.reject}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                {approved &&
                                  !hasPending && (
                                    <div className="mt-5 rounded-xl border-2 border-green-300 bg-green-50 p-5 text-center">
                                      <p className="text-lg font-bold text-green-700">
                                        {t.approvedMessage}
                                      </p>

                                      <p className="mt-2 text-sm text-green-600">
                                        {
                                          t.approvedCurrent
                                        }:{" "}
                                        {
                                          item.quantity
                                        }
                                      </p>
                                    </div>
                                  )}

                                {rejected &&
                                  !hasPending && (
                                    <div className="mt-5 rounded-xl border-2 border-red-300 bg-red-50 p-5 text-center">
                                      <p className="text-lg font-bold text-red-700">
                                        {t.rejectedMessage}
                                      </p>

                                      <p className="mt-2 text-sm text-red-600">
                                        {
                                          t.rejectedText
                                        }
                                      </p>

                                      <p className="mt-2 text-sm font-bold text-gray-700">
                                        {t.current}:{" "}
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
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* =====================================================
            سلة المحذوفات
        ===================================================== */}

        {trashOpen && (
          <div className="fixed inset-0 z-[250] bg-black/60 p-3 sm:p-5">
            <div className="mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[calc(100dvh-2.5rem)]">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-xl font-bold text-red-700 sm:text-2xl">
                    {t.trashTitle}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {t.trashText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTrashOpen(
                      false
                    )
                  }
                  className="text-2xl text-gray-500 hover:text-red-600"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-2 border-b bg-gray-50 p-4">
                <button
                  type="button"
                  onClick={
                    restoreAllOrders
                  }
                  disabled={
                    restoringAll ||
                    restoringOrderId !==
                      null ||
                    !trashOrders.length
                  }
                  className="rounded-xl bg-green-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {restoringAll
                    ? t.restoringAll
                    : t.restoreAll}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadTrashOrders(
                      userId
                    )
                  }
                  className="rounded-xl border bg-white px-4 py-2.5 font-bold text-gray-900"
                >
                  {t.refresh}
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {trashLoading ? (
                  <div className="py-10 text-center font-bold text-red-600">
                    {isArabic
                      ? "جاري تحميل سلة المحذوفات..."
                      : "Loading trash..."}
                  </div>
                ) : trashOrders.length ===
                  0 ? (
                  <div className="rounded-xl bg-gray-50 p-10 text-center">
                    <div className="text-5xl">
                      🗑️
                    </div>

                    <p className="mt-3 font-bold text-gray-700">
                      {t.emptyTrash}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trashOrders.map(
                      (
                        order: Order
                      ) => (
                        <div
                          key={
                            order.id
                          }
                          className="rounded-xl border-2 border-red-100 bg-red-50 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold text-gray-800">
                                {t.orderNumber}{" "}
                                {
                                  order.id
                                }
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {t.status}:{" "}
                                {
                                  getStatusLabel(
                                    order.status
                                  )
                                }
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {t.total}:{" "}
                                {
                                  order.total
                                }{" "}
                                {isArabic
                                  ? "جنيه"
                                  : "EGP"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                restoreOrder(
                                  order
                                )
                              }
                              disabled={
                                restoringAll ||
                                restoringOrderId ===
                                  order.id
                              }
                              className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                            >
                              {restoringOrderId ===
                              order.id
                                ? t.restoring
                                : t.restoreOrder}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            Popup الإشعارات
            يظهر مباشرة عند وصول إشعار جديد
        ===================================================== */}

        {notificationsOpen && (
          <div className="fixed inset-0 z-[300] bg-black/60 p-3 sm:p-5">
            <div className="mx-auto mt-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:mt-8">
              <div className="flex shrink-0 items-center justify-between border-b p-4 sm:p-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    {t.notifications}
                  </h2>

                  <p className="mt-1 text-sm text-gray-700">
                    {isArabic
                      ? "لديك"
                      : "You have"}{" "}
                    <strong>
                      {
                        unreadNotifications.length
                      }
                    </strong>{" "}
                    {
                      t.notificationCount
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      false
                    )
                  }
                  className="text-2xl font-bold text-gray-700 hover:text-red-600"
                >
                  ✕
                </button>
              </div>

              <div className="shrink-0 border-b bg-gray-50 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={
                      enableNotificationSound
                    }
                    className={`rounded-xl px-4 py-3 font-bold ${
                      soundEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    {soundEnabled
                      ? t.soundEnabled
                      : t.notificationSound}
                  </button>

                  <button
                    type="button"
                    onClick={
                      markAllNotificationsAsRead
                    }
                    disabled={
                      unreadNotifications.length ===
                      0
                    }
                    className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {t.readAll}
                  </button>

                  <button
                    type="button"
                    onClick={
                      deleteAllNotifications
                    }
                    disabled={
                      deletingAllNotifications ||
                      notifications.length ===
                        0
                    }
                    className="rounded-xl border border-red-500 bg-white px-4 py-3 font-bold text-red-700 disabled:opacity-50"
                  >
                    {deletingAllNotifications
                      ? t.deleting
                      : t.deleteAllNotifications}
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {notifications.length ===
                0 ? (
                  <div className="rounded-xl bg-gray-50 p-10 text-center">
                    <div className="text-5xl">
                      🔕
                    </div>

                    <p className="mt-4 font-bold text-gray-800">
                      {t.noNotifications}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(
                      (
                        notification: Notification
                      ) => {
                        const relatedChange =
                          notification.type ===
                            "quantity_change" &&
                          notification.order_item_id
                            ? quantityChanges.find(
                                (
                                  change: QuantityChange
                                ) =>
                                  change.order_item_id ===
                                    notification.order_item_id &&
                                  change.order_id ===
                                    notification.order_id
                              )
                            : null;

                        const isQuantityNotification =
                          notification.type ===
                          "quantity_change";

                        const relatedItem =
                          relatedChange
                            ? (
                                orderItems[
                                  relatedChange.order_id
                                ] || []
                              ).find(
                                (
                                  item: OrderItem
                                ) =>
                                  item.id ===
                                  relatedChange.order_item_id
                              )
                            : null;

                        return (
                          <div
                            key={
                              notification.id
                            }
                            className={`rounded-xl border-2 p-4 ${
                              notification.is_read
                                ? "border-gray-200 bg-white"
                                : "border-blue-300 bg-blue-50"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="shrink-0 text-2xl">
                                {notification.type ===
                                "quantity_change"
                                  ? "📦"
                                  : notification.type ===
                                    "order_status"
                                  ? "🚚"
                                  : "🔔"}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="break-words font-bold text-gray-900">
                                      {
                                        notification.title
                                      }
                                    </h3>

                                    <p className="mt-2 break-words text-gray-800">
                                      {
                                        notification.message
                                      }
                                    </p>

                                    <p className="mt-2 text-xs text-gray-600">
                                      {new Date(
                                        notification.created_at
                                      ).toLocaleString(
                                        isArabic
                                          ? "ar-EG"
                                          : "en-US"
                                      )}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 flex-col gap-2">
                                    {!notification.is_read && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          markNotificationRead(
                                            notification.id
                                          )
                                        }
                                        className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800"
                                      >
                                        {t.read}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteNotification(
                                          notification.id
                                        )
                                      }
                                      disabled={
                                        deletingNotificationId ===
                                        notification.id
                                      }
                                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                                    >
                                      {deletingNotificationId ===
                                      notification.id
                                        ? "⏳"
                                        : t.delete}
                                    </button>
                                  </div>
                                </div>

                                {isQuantityNotification &&
                                  relatedChange &&
                                  relatedChange.status ===
                                    "pending" &&
                                  relatedItem && (
                                    <div className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
                                      <p className="font-bold text-orange-800">
                                        {t.needApproval}
                                      </p>

                                      <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-white p-3 text-center">
                                          <p className="text-xs text-gray-700">
                                            {
                                              t.originalQuantity
                                            }
                                          </p>

                                          <p className="text-2xl font-black text-blue-800">
                                            {
                                              relatedChange.old_quantity
                                            }
                                          </p>
                                        </div>

                                        <div className="rounded-lg bg-white p-3 text-center">
                                          <p className="text-xs text-gray-700">
                                            {
                                              t.proposedQuantity
                                            }
                                          </p>

                                          <p className="text-2xl font-black text-orange-700">
                                            {
                                              relatedChange.new_quantity
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            respondToQuantityChange(
                                              relatedItem,
                                              relatedChange,
                                              true
                                            )
                                          }
                                          disabled={
                                            approvalId ===
                                            relatedItem.id
                                          }
                                          className="flex-1 rounded-xl bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                                        >
                                          {approvalId ===
                                          relatedItem.id
                                            ? t.saving
                                            : t.approve}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            respondToQuantityChange(
                                              relatedItem,
                                              relatedChange,
                                              false
                                            )
                                          }
                                          disabled={
                                            approvalId ===
                                            relatedItem.id
                                          }
                                          className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                                        >
                                          {approvalId ===
                                          relatedItem.id
                                            ? t.saving
                                            : t.reject}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                {isQuantityNotification &&
                                  relatedChange?.status ===
                                    "approved" && (
                                    <div className="mt-4 rounded-xl border-2 border-green-300 bg-green-50 p-3 text-center font-bold text-green-800">
                                      {t.approved}
                                    </div>
                                  )}

                                {isQuantityNotification &&
                                  relatedChange?.status ===
                                    "rejected" && (
                                    <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center font-bold text-red-800">
                                      {t.rejected}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}