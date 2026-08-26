"use client";

import {
  useState,
  useEffect,
  useRef,
} from "react";
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
  hidden_from_admin: boolean | null;
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
  {
    value: "جديد",
    label: "جديد",
  },
  {
    value: "قيد التجهيز",
    label: "قيد التجهيز",
  },
  {
    value: "تم الشحن",
    label: "تم الشحن",
  },
  {
    value: "تم التسليم",
    label: "تم التسليم",
  },
  {
    value: "ملغي",
    label: "ملغي",
  },
];

export default function AdminPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [trashOrders, setTrashOrders] =
    useState<Order[]>([]);

  const [orderItems, setOrderItems] =
    useState<Record<number, OrderItem[]>>(
      {}
    );

  const [products, setProducts] =
    useState<Record<number, Product>>(
      {}
    );

  const [quantityValues, setQuantityValues] =
    useState<Record<number, number>>(
      {}
    );

  const [
    originalQuantityValues,
    setOriginalQuantityValues,
  ] =
    useState<Record<number, number>>(
      {}
    );

  const [quantityTouched, setQuantityTouched] =
    useState<Record<number, boolean>>(
      {}
    );

  const [draftStatuses, setDraftStatuses] =
    useState<Record<number, string>>(
      {}
    );

  const [quantityChanges, setQuantityChanges] =
    useState<QuantityChange[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  const [savingOrderId, setSavingOrderId] =
    useState<number | null>(null);

  const [stockUpdatingId, setStockUpdatingId] =
    useState<number | null>(null);

  const [deletingOrderId, setDeletingOrderId] =
    useState<number | null>(null);

  const [deletingStatus, setDeletingStatus] =
    useState<string | null>(null);

  const [deletingAll, setDeletingAll] =
    useState(false);

  const [trashOpen, setTrashOpen] =
    useState(false);

  const [trashLoading, setTrashLoading] =
    useState(false);

  const [restoringOrderId, setRestoringOrderId] =
    useState<number | null>(null);

  const [restoringAll, setRestoringAll] =
    useState(false);

  const [
    deletingNotificationId,
    setDeletingNotificationId,
  ] =
    useState<number | null>(null);

  const [
    deletingAllNotifications,
    setDeletingAllNotifications,
  ] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [newOrderAlert, setNewOrderAlert] =
    useState<Order | null>(null);

  const [soundEnabled, setSoundEnabled] =
    useState(false);

  const soundEnabledRef =
    useRef(false);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const loadingOrdersRef =
    useRef(false);

  const lastKnownOrderIdRef =
    useRef<number | null>(null);

  const lastKnownAdminNotificationIdRef =
    useRef<number | null>(null);

  const adminUserIdRef =
    useRef<string | null>(null);

  const dirtyStatusRef =
    useRef<Record<number, string>>(
      {}
    );

  const dirtyQuantityRef =
    useRef<Record<number, number>>(
      {}
    );

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

    if (!audioContextRef.current) {
      audioContextRef.current =
        new AudioContextClass();
    }

    return audioContextRef.current;
  }

  async function ensureAudioReady() {
    const audioContext =
      createAudioContext();

    if (!audioContext) {
      return null;
    }

    if (
      audioContext.state ===
      "suspended"
    ) {
      try {
        await audioContext.resume();
      } catch {
        return null;
      }
    }

    return audioContext;
  }

  function playTone(
    frequencies: number[],
    type: OscillatorType,
    duration: number,
    volume: number
  ) {
    if (
      !soundEnabledRef.current
    ) {
      return;
    }

    try {
      const audioContext =
        audioContextRef.current;

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
        type;

      frequencies.forEach(
        (
          frequency: number,
          index: number
        ) => {
          oscillator.frequency.setValueAtTime(
            frequency,
            audioContext.currentTime +
              index * 0.12
          );
        }
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        volume,
        audioContext.currentTime +
          0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          duration
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
          duration
      );
    } catch (error) {
      console.error(
        "PLAY TONE ERROR:",
        error
      );
    }
  }

  function playNewOrderSound() {
    playTone(
      [880, 660, 880],
      "sine",
      0.55,
      0.3
    );
  }

  function playCustomerApprovedSound() {
    playTone(
      [520, 720, 920],
      "sine",
      0.42,
      0.28
    );
  }

  function playCustomerRejectedSound() {
    playTone(
      [720, 480, 330],
      "square",
      0.48,
      0.18
    );
  }

  function playCustomerResponseSound(
    notification: Notification
  ) {
    if (
      notification.type !==
      "quantity_response"
    ) {
      return;
    }

    const title =
      notification.title || "";

    const message =
      notification.message || "";

    if (
      title.includes("وافق") ||
      message.includes("وافق")
    ) {
      playCustomerApprovedSound();
      return;
    }

    if (
      title.includes("رفض") ||
      message.includes("رفض")
    ) {
      playCustomerRejectedSound();
    }
  }

  async function enableNotificationSound() {
    try {
      const audioContext =
        await ensureAudioReady();

      if (!audioContext) {
        alert(
          "المتصفح لا يدعم تشغيل صوت التنبيهات."
        );
        return;
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
        0.2,
        audioContext.currentTime +
          0.02
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          0.25
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
          0.25
      );

      soundEnabledRef.current =
        true;

      setSoundEnabled(
        true
      );
    } catch (error) {
      console.error(
        "ENABLE NOTIFICATION SOUND ERROR:",
        error
      );

      alert(
        "تعذر تفعيل صوت التنبيهات."
      );
    }
  }

  // =====================================================
  // المخزون
  // =====================================================

  function shouldHaveStockDeducted(
    status: string
  ) {
    return (
      status !== "جديد" &&
      status !== "ملغي"
    );
  }

  // =====================================================
  // المنتجات
  // =====================================================

  async function loadProducts() {
    const {
      data,
      error,
    } =
      await supabase
        .from("products")
        .select(
          "id,name_ar,name_en,image_url,stock"
        );

    if (error) {
      console.error(
        "LOAD PRODUCTS ERROR:",
        error
      );
      return;
    }

    const productMap: Record<
      number,
      Product
    > = {};

    (
      data || []
    ).forEach(
      (
        product
      ) => {
        const p =
          product as Product;

        productMap[p.id] =
          p;
      }
    );

    setProducts(
      productMap
    );
  }

  // =====================================================
  // تغييرات الكمية
  // =====================================================

  async function loadQuantityChanges() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "order_quantity_changes"
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (error) {
      console.error(
        "LOAD QUANTITY CHANGES ERROR:",
        error
      );
      return;
    }

    setQuantityChanges(
      (
        data ||
        []
      ) as QuantityChange[]
    );
  }

  // =====================================================
  // الإشعارات
  // =====================================================

  async function loadAdminNotifications(
    checkForNewResponse = false
  ) {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return;
    }

    adminUserIdRef.current =
      user.id;

    const {
      data,
      error,
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
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (error) {
      console.error(
        "LOAD ADMIN NOTIFICATIONS ERROR:",
        error
      );
      return;
    }

    const loadedNotifications =
      (
        data ||
        []
      ) as Notification[];

    const latestNotification =
      loadedNotifications[0];

    if (
      checkForNewResponse &&
      latestNotification &&
      lastKnownAdminNotificationIdRef.current !==
        null &&
      latestNotification.id >
        lastKnownAdminNotificationIdRef.current
    ) {
      if (
        latestNotification.type ===
        "quantity_response"
      ) {
        playCustomerResponseSound(
          latestNotification
        );
      }
    }

    if (latestNotification) {
      lastKnownAdminNotificationIdRef.current =
        latestNotification.id;
    }

    setNotifications(
      loadedNotifications
    );
  }

  async function markAdminNotificationRead(
    notificationId: number
  ) {
    if (
      !adminUserIdRef.current
    ) {
      return;
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
          adminUserIdRef.current
        );

    if (error) {
      console.error(
        "MARK ADMIN NOTIFICATION ERROR:",
        error
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
  }

  async function markAllNotificationsAsRead() {
    if (
      !adminUserIdRef.current
    ) {
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
      !unreadIds.length
    ) {
      return;
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
        .in(
          "id",
          unreadIds
        )
        .eq(
          "user_id",
          adminUserIdRef.current
        );

    if (error) {
      alert(
        "حدث خطأ أثناء تعليم الإشعارات كمقروءة."
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

  async function deleteAdminNotification(
    notificationId: number
  ) {
    if (
      !adminUserIdRef.current
    ) {
      return;
    }

    if (
      deletingNotificationId !==
      null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "هل تريد حذف هذا الإشعار؟"
      );

    if (!confirmed) {
      return;
    }

    setDeletingNotificationId(
      notificationId
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
            adminUserIdRef.current
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          "فشل حذف الإشعار:\n" +
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
          "لم يتم حذف الإشعار. تأكد من صلاحيات الحذف في Supabase."
        );
        return;
      }

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
    } finally {
      setDeletingNotificationId(
        null
      );
    }
  }

  async function deleteAllAdminNotifications() {
    if (
      deletingAllNotifications ||
      !adminUserIdRef.current ||
      notifications.length ===
        0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد حذف كل إشعارات الأدمن وعددها ${notifications.length}؟`
      );

    if (!confirmed) {
      return;
    }

    setDeletingAllNotifications(
      true
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
            adminUserIdRef.current
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          "فشل حذف كل الإشعارات:\n" +
            error.message
        );
        return;
      }

      if (
        !data?.length
      ) {
        alert(
          "لم يتم حذف أي إشعار. تأكد من صلاحيات الحذف في Supabase."
        );
        return;
      }

      setNotifications([]);
    } finally {
      setDeletingAllNotifications(
        false
      );
    }
  }

  // =====================================================
  // الطلبات
  // =====================================================

  async function loadOrders(
    showLoading = true
  ) {
    if (
      loadingOrdersRef.current
    ) {
      return;
    }

    loadingOrdersRef.current =
      true;

    if (showLoading) {
      setLoading(
        true
      );
    }

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        return;
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "role"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (
        profileError ||
        !profile ||
        profile.role !==
          "admin"
      ) {
        setAllowed(false);
        return;
      }

      setAllowed(true);

      adminUserIdRef.current =
        user.id;

      const {
        data,
        error,
      } =
        await supabase
          .from("orders")
          .select("*")
          .or(
            "hidden_from_admin.is.null,hidden_from_admin.eq.false"
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
          "LOAD ORDERS ERROR:",
          error
        );

        if (showLoading) {
          alert(
            "خطأ في جلب الطلبات:\n" +
              error.message
          );
        }

        setOrders([]);
        return;
      }

      const loadedOrders =
        (
          data ||
          []
        ) as Order[];

      const latestOrder =
        loadedOrders[0];

      if (
        !showLoading &&
        latestOrder &&
        lastKnownOrderIdRef.current !==
          null &&
        latestOrder.id >
          lastKnownOrderIdRef.current
      ) {
        setNewOrderAlert(
          latestOrder
        );

        playNewOrderSound();
      }

      if (latestOrder) {
        lastKnownOrderIdRef.current =
          latestOrder.id;
      }

      setOrders(
        loadedOrders
      );

      setDraftStatuses(
        (
          currentDrafts: Record<
            number,
            string
          >
        ) => {
          const next = {
            ...currentDrafts,
          };

          loadedOrders.forEach(
            (
              serverOrder: Order
            ) => {
              const dirtyValue =
                dirtyStatusRef.current[
                  serverOrder.id
                ];

              next[
                serverOrder.id
              ] =
                dirtyValue !==
                undefined
                  ? dirtyValue
                  : serverOrder.status;
            }
          );

          return next;
        }
      );

      await loadOrderItems(
        loadedOrders
      );

      await loadProducts();
      await loadQuantityChanges();

      await loadAdminNotifications(
        !showLoading
      );
    } catch (error) {
      console.error(
        "ADMIN LOAD ERROR:",
        error
      );

      if (showLoading) {
        alert(
          "حدث خطأ أثناء تحميل لوحة التحكم."
        );
      }
    } finally {
      loadingOrdersRef.current =
        false;

      if (showLoading) {
        setLoading(
          false
        );
      }
    }
  }

  // =====================================================
  // عناصر الطلب
  // =====================================================

  async function loadOrderItems(
    loadedOrders: Order[]
  ) {
    if (
      !loadedOrders.length
    ) {
      setOrderItems({});
      setQuantityValues({});
      setOriginalQuantityValues({});
      return;
    }

    const orderIds =
      loadedOrders.map(
        (
          order: Order
        ) =>
          order.id
      );

    const {
      data: items,
      error: itemsError,
    } =
      await supabase
        .from(
          "order_items"
        )
        .select("*")
        .in(
          "order_id",
          orderIds
        );

    if (itemsError) {
      console.error(
        "LOAD ORDER ITEMS ERROR:",
        itemsError
      );
      return;
    }

    const grouped: Record<
      number,
      OrderItem[]
    > = {};

    const serverQuantities: Record<
      number,
      number
    > = {};

    (
      items ||
      []
    ).forEach(
      (
        item
      ) => {
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
        ].push(
          currentItem
        );

        serverQuantities[
          currentItem.id
        ] =
          Number(
            currentItem.quantity
          );
      }
    );

    setOrderItems(
      grouped
    );

    setOriginalQuantityValues(
      (
        current: Record<
          number,
          number
        >
      ) => {
        const next = {
          ...current,
        };

        Object.entries(
          serverQuantities
        ).forEach(
          (
            [idText, quantity]: [
              string,
              number
            ]
          ) => {
            const itemId =
              Number(
                idText
              );

            next[itemId] =
              quantity;
          }
        );

        return next;
      }
    );

    setQuantityValues(
      (
        current: Record<
          number,
          number
        >
      ) => {
        const next = {
          ...current,
        };

        Object.entries(
          serverQuantities
        ).forEach(
          (
            [idText, quantity]: [
              string,
              number
            ]
          ) => {
            const itemId =
              Number(
                idText
              );

            const dirtyValue =
              dirtyQuantityRef.current[
                itemId
              ];

            next[itemId] =
              dirtyValue !==
              undefined
                ? dirtyValue
                : quantity;
          }
        );

        return next;
      }
    );
  }

  // =====================================================
  // التعديلات
  // =====================================================

  function hasOrderChanges(
    order: Order
  ) {
    const draftStatus =
      draftStatuses[
        order.id
      ] ??
      order.status;

    if (
      draftStatus !==
      order.status
    ) {
      return true;
    }

    const items =
      orderItems[
        order.id
      ] || [];

    return items.some(
      (
        item: OrderItem
      ) => {
        const currentQuantity =
          Number(
            quantityValues[
              item.id
            ] ??
              item.quantity
          );

        const originalQuantity =
          Number(
            originalQuantityValues[
              item.id
            ] ??
              item.quantity
          );

        return (
          quantityTouched[
            item.id
          ] === true ||
          currentQuantity !==
            originalQuantity
        );
      }
    );
  }

  // =====================================================
  // سلة محذوفات الأدمن
  // =====================================================

  async function loadTrashOrders() {
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
          .select("*")
          .eq(
            "hidden_from_admin",
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
        alert(
          "حدث خطأ أثناء تحميل سلة المحذوفات:\n" +
            error.message
        );
        return;
      }

      setTrashOrders(
        (data ||
          []) as Order[]
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

    await loadTrashOrders();
  }

  async function restoreOrder(
    order: Order
  ) {
    if (
      restoringOrderId !==
        null ||
      restoringAll
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
            hidden_from_admin:
              false,
          })
          .eq(
            "id",
            order.id
          )
          .eq(
            "hidden_from_admin",
            true
          )
          .select(
            "id"
          )
          .maybeSingle();

      if (error) {
        alert(
          "فشل استرجاع الطلب:\n" +
            error.message
        );
        return;
      }

      if (!data) {
        alert(
          "لم يتم استرجاع الطلب."
        );
        return;
      }

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
                order,
                ...current,
              ]
      );

      setDraftStatuses(
        (
          current
        ) => ({
          ...current,
          [order.id]:
            order.status,
        })
      );
    } finally {
      setRestoringOrderId(
        null
      );
    }
  }

  async function restoreAllOrders() {
    if (
      restoringAll ||
      restoringOrderId !==
        null ||
      !trashOrders.length
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد استرجاع كل الطلبات الموجودة في سلة المحذوفات وعددها ${trashOrders.length}؟`
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
            hidden_from_admin:
              false,
          })
          .in(
            "id",
            ids
          )
          .eq(
            "hidden_from_admin",
            true
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          "فشل استرجاع الطلبات:\n" +
            error.message
        );
        return;
      }

      const restoredIds =
        (
          data ||
          []
        ).map(
          (
            item: {
              id: number;
            }
          ) =>
            item.id
        );

      const restoredOrders =
        trashOrders.filter(
          (
            order: Order
          ) =>
            restoredIds.includes(
              order.id
            )
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

      alert(
        `تم استرجاع ${restoredIds.length} طلب ✅`
      );
    } finally {
      setRestoringAll(
        false
      );
    }
  }

  async function hideSingleOrder(
    order: Order
  ) {
    if (
      deletingOrderId !==
        null ||
      deletingAll ||
      deletingStatus !==
        null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد نقل الطلب رقم ${order.id} إلى سلة المحذوفات؟\n\nالطلب سيظل موجودًا عند العميل.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingOrderId(
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
            hidden_from_admin:
              true,
          })
          .eq(
            "id",
            order.id
          )
          .or(
            "hidden_from_admin.is.null,hidden_from_admin.eq.false"
          )
          .select(
            "id"
          )
          .maybeSingle();

      if (error) {
        alert(
          "فشل نقل الطلب إلى السلة:\n" +
            error.message
        );
        return;
      }

      if (!data) {
        alert(
          "لم يتم نقل الطلب."
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
            hidden_from_admin:
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

      delete dirtyStatusRef.current[
        order.id
      ];
    } finally {
      setDeletingOrderId(
        null
      );
    }
  }

  async function hideOrdersByStatus(
    status: string
  ) {
    if (
      deletingOrderId !==
        null ||
      deletingAll ||
      deletingStatus !==
        null
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
      !matchingOrders.length
    ) {
      alert(
        `لا توجد طلبات بحالة "${status}".`
      );
      return;
    }

    const confirmed =
      window.confirm(
        `سيتم نقل ${matchingOrders.length} طلب/طلبات بحالة "${status}" إلى سلة المحذوفات.\n\nالطلبات ستظل موجودة عند العملاء.\n\nهل تريد المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    setDeletingStatus(
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
            hidden_from_admin:
              true,
          })
          .in(
            "id",
            ids
          )
          .or(
            "hidden_from_admin.is.null,hidden_from_admin.eq.false"
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          "فشل نقل الطلبات:\n" +
            error.message
        );
        return;
      }

      const hiddenIds =
        (
          data ||
          []
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
            hiddenIds.includes(
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
              !hiddenIds.includes(
                order.id
              )
          )
      );

      setTrashOrders(
        (
          current: Order[]
        ) => [
          ...movedOrders,
          ...current.filter(
            (
              order: Order
            ) =>
              !hiddenIds.includes(
                order.id
              )
          ),
        ]
      );

      hiddenIds.forEach(
        (
          id: number
        ) => {
          delete dirtyStatusRef.current[
            id
          ];
        }
      );

      alert(
        `تم نقل ${hiddenIds.length} طلب إلى سلة المحذوفات ✅`
      );
    } finally {
      setDeletingStatus(
        null
      );
    }
  }

  async function hideAllOrders() {
    if (
      deletingOrderId !==
        null ||
      deletingAll ||
      deletingStatus !==
        null ||
      !orders.length
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `سيتم نقل جميع الطلبات الموجودة في الأدمن وعددها ${orders.length} إلى سلة المحذوفات.\n\nالطلبات ستظل موجودة عند العملاء.\n\nهل تريد المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    setDeletingAll(
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
            hidden_from_admin:
              true,
          })
          .in(
            "id",
            ids
          )
          .or(
            "hidden_from_admin.is.null,hidden_from_admin.eq.false"
          )
          .select(
            "id"
          );

      if (error) {
        alert(
          "فشل نقل الطلبات:\n" +
            error.message
        );
        return;
      }

      const hiddenIds =
        (
          data ||
          []
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
            hiddenIds.includes(
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
              !hiddenIds.includes(
                order.id
              )
          )
      );

      setTrashOrders(
        (
          current: Order[]
        ) => [
          ...movedOrders,
          ...current,
        ]
      );

      dirtyStatusRef.current =
        {};

      dirtyQuantityRef.current =
        {};

      setQuantityValues(
        {}
      );

      setOriginalQuantityValues(
        {}
      );

      setQuantityTouched(
        {}
      );

      setDraftStatuses(
        {}
      );
    } finally {
      setDeletingAll(
        false
      );
    }
  }

  // =====================================================
  // خصم المخزون
  // =====================================================

  async function deductStock(
    order: Order,
    items: OrderItem[]
  ) {
    if (
      order.stock_deducted
    ) {
      return true;
    }

    if (!items.length) {
      alert(
        "لا يمكن خصم المخزون لأن الطلب لا يحتوي على منتجات."
      );
      return false;
    }

    const {
      data: freshProducts,
      error:
        freshProductsError,
    } =
      await supabase
        .from("products")
        .select(
          "id,name_ar,name_en,image_url,stock"
        );

    if (freshProductsError) {
      alert(
        "فشل قراءة المخزون:\n" +
          freshProductsError.message
      );
      return false;
    }

    const productMap: Record<
      number,
      Product
    > = {};

    (
      freshProducts ||
      []
    ).forEach(
      (
        product
      ) => {
        const p =
          product as Product;

        productMap[p.id] =
          p;
      }
    );

    for (
      const item of items
    ) {
      const product =
        productMap[
          item.product_id
        ];

      if (!product) {
        alert(
          `المنتج "${item.product_name}" غير موجود في المخزون.`
        );
        return false;
      }

      const quantity =
        Number(
          item.quantity
        );

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        alert(
          `الكمية الخاصة بالمنتج "${item.product_name}" غير صحيحة.`
        );
        return false;
      }

      if (
        product.stock <
        quantity
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
      for (
        const item of items
      ) {
        const product =
          productMap[
            item.product_id
          ];

        const quantity =
          Number(
            item.quantity
          );

        const {
          error,
        } =
          await supabase
            .from(
              "products"
            )
            .update({
              stock:
                product.stock -
                quantity,
            })
            .eq(
              "id",
              item.product_id
            );

        if (error) {
          alert(
            `حدث خطأ أثناء خصم مخزون "${item.product_name}":\n${error.message}`
          );

          await loadProducts();

          return false;
        }
      }

      const {
        error:
          flagError,
      } =
        await supabase
          .from("orders")
          .update({
            stock_deducted:
              true,
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
        alert(
          "تم خصم المخزون ولكن حدث خطأ أثناء تسجيل الحالة."
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
    if (
      !order.stock_deducted
    ) {
      return true;
    }

    if (!items.length) {
      alert(
        "لا توجد منتجات لإعادة مخزونها."
      );
      return false;
    }

    setStockUpdatingId(
      order.id
    );

    try {
      const {
        data: freshProducts,
        error:
          freshProductsError,
      } =
        await supabase
          .from("products")
          .select(
            "id,name_ar,name_en,image_url,stock"
          );

      if (freshProductsError) {
        alert(
          "فشل قراءة المخزون:\n" +
            freshProductsError.message
        );
        return false;
      }

      const productMap: Record<
        number,
        Product
      > = {};

      (
        freshProducts ||
        []
      ).forEach(
        (
          product
        ) => {
          const p =
            product as Product;

          productMap[p.id] =
            p;
        }
      );

      for (
        const item of items
      ) {
        const product =
          productMap[
            item.product_id
          ];

        if (!product) {
          alert(
            `المنتج "${item.product_name}" غير موجود.`
          );
          return false;
        }

        const quantity =
          Number(
            item.quantity
          );

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity < 1
        ) {
          alert(
            `الكمية الخاصة بالمنتج "${item.product_name}" غير صحيحة.`
          );
          return false;
        }

        const {
          error,
        } =
          await supabase
            .from(
              "products"
            )
            .update({
              stock:
                product.stock +
                quantity,
            })
            .eq(
              "id",
              item.product_id
            );

        if (error) {
          alert(
            `حدث خطأ أثناء إعادة المخزون:\n${error.message}`
          );

          await loadProducts();

          return false;
        }
      }

      const {
        error:
          flagError,
      } =
        await supabase
          .from("orders")
          .update({
            stock_deducted:
              false,
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
        alert(
          "تمت إعادة المخزون ولكن تعذر تسجيل الحالة."
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
  // حفظ التغييرات
  // =====================================================

  async function saveOrderChanges(
    order: Order
  ) {
    if (
      savingOrderId ===
      order.id
    ) {
      return;
    }

    const newStatus =
      draftStatuses[
        order.id
      ] ??
      order.status;

    const items =
      orderItems[
        order.id
      ] || [];

    const changedItems =
      items.filter(
        (
          item: OrderItem
        ) => {
          const touched =
            quantityTouched[
              item.id
            ] === true;

          const newQuantity =
            Number(
              quantityValues[
                item.id
              ] ??
                item.quantity
            );

          const oldQuantity =
            Number(
              originalQuantityValues[
                item.id
              ] ??
                item.quantity
            );

          return (
            touched ||
            newQuantity !==
              oldQuantity
          );
        }
      );

    if (
      newStatus ===
        order.status &&
      changedItems.length ===
        0
    ) {
      alert(
        "لا توجد تعديلات لحفظها."
      );
      return;
    }

    if (
      changedItems.length >
        0 &&
      newStatus !==
        "جديد"
    ) {
      alert(
        'تعديل الكمية متاح فقط عندما تكون حالة الطلب "جديد".'
      );
      return;
    }

    for (
      const item of changedItems
    ) {
      const newQuantity =
        Number(
          quantityValues[
            item.id
          ] ??
            item.quantity
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

      if (
        newStatus !==
        oldStatus
      ) {
        const needsStock =
          shouldHaveStockDeducted(
            newStatus
          );

        if (
          needsStock &&
          !order.stock_deducted
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

        if (
          !needsStock &&
          order.stock_deducted
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

        const {
          error,
        } =
          await supabase
            .from("orders")
            .update({
              status:
                newStatus,
            })
            .eq(
              "id",
              order.id
            );

        if (error) {
          alert(
            "فشل حفظ حالة الطلب:\n" +
              error.message
          );
          return;
        }

        const {
          error:
            notificationError,
        } =
          await supabase
            .from(
              "notifications"
            )
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
              is_read:
                false,
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

      // نفس الكمية بعد الرفض مسموح بها
      for (
        const item of changedItems
      ) {
        const newQuantity =
          Number(
            quantityValues[
              item.id
            ] ??
              item.quantity
          );

        const oldQuantity =
          Number(
            originalQuantityValues[
              item.id
            ] ??
              item.requested_quantity ??
              item.quantity
          );

        const {
          data:
            pendingChange,
          error:
            pendingError,
        } =
          await supabase
            .from(
              "order_quantity_changes"
            )
            .select(
              "id"
            )
            .eq(
              "order_item_id",
              item.id
            )
            .eq(
              "order_id",
              order.id
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

        const {
          data: change,
          error:
            changeError,
        } =
          await supabase
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
            .select(
              "*"
            )
            .single();

        if (
          changeError ||
          !change
        ) {
          alert(
            "فشل إنشاء طلب تعديل الكمية:\n" +
              (
                changeError?.message ||
                "خطأ غير معروف"
              )
          );
          return;
        }

        const {
          error:
            quantityNotificationError,
        } =
          await supabase
            .from(
              "notifications"
            )
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
              is_read:
                false,
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

      setOrders(
        (
          currentOrders: Order[]
        ) =>
          currentOrders.map(
            (
              currentOrder: Order
            ) =>
              currentOrder.id ===
              order.id
                ? {
                    ...currentOrder,
                    status:
                      newStatus,
                    stock_deducted:
                      shouldHaveStockDeducted(
                        newStatus
                      ),
                  }
                : currentOrder
          )
      );

      setDraftStatuses(
        (
          current
        ) => ({
          ...current,
          [order.id]:
            newStatus,
        })
      );

      delete dirtyStatusRef.current[
        order.id
      ];

      if (
        changedItems.length >
        0
      ) {
        setQuantityValues(
          (
            current
          ) => {
            const next = {
              ...current,
            };

            changedItems.forEach(
              (
                item: OrderItem
              ) => {
                next[
                  item.id
                ] =
                  Number(
                    originalQuantityValues[
                      item.id
                    ] ??
                      item.quantity
                  );

                delete dirtyQuantityRef
                  .current[
                  item.id
                ];
              }
            );

            return next;
          }
        );

        setQuantityTouched(
          (
            current
          ) => {
            const next = {
              ...current,
            };

            changedItems.forEach(
              (
                item: OrderItem
              ) => {
                delete next[
                  item.id
                ];
              }
            );

            return next;
          }
        );
      }

      await loadProducts();
      await loadQuantityChanges();
      await loadAdminNotifications(
        false
      );

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
  // تنبيه الطلب
  // =====================================================

  function closeNewOrderAlert() {
    setNewOrderAlert(
      null
    );
  }

  // =====================================================
  // Realtime + Polling
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function start() {
      await loadOrders(
        true
      );

      if (!mounted) {
        return;
      }
    }

    start();

    const polling =
      window.setInterval(
        async () => {
          if (!mounted) {
            return;
          }

          // لا يحدث أثناء وجود تعديل غير محفوظ
          if (
            savingOrderId !==
              null ||
            stockUpdatingId !==
              null
          ) {
            return;
          }

          await loadOrders(
            false
          );
        },
        3000
      );

    const channel =
      supabase.channel(
        "admin-dashboard-realtime"
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
            "orders",
        },
        async (
          payload: {
            new: Order;
          }
        ) => {
          const newOrder =
            payload.new;

          if (
            !newOrder.hidden_from_admin
          ) {
            setNewOrderAlert(
              newOrder
            );

            playNewOrderSound();
          }

          await loadOrders(
            false
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "INSERT",
          schema:
            "public",
          table:
            "notifications",
        },
        async (
          payload: {
            new: Notification;
          }
        ) => {
          const notification =
            payload.new;

          if (
            adminUserIdRef.current &&
            notification.user_id ===
              adminUserIdRef.current
          ) {
            setNotifications(
              (
                current: Notification[]
              ) => {
                const exists =
                  current.some(
                    (
                      item: Notification
                    ) =>
                      item.id ===
                      notification.id
                  );

                if (exists) {
                  return current;
                }

                return [
                  notification,
                  ...current,
                ];
              }
            );

            lastKnownAdminNotificationIdRef.current =
              Math.max(
                lastKnownAdminNotificationIdRef.current ??
                  0,
                notification.id
              );

            playCustomerResponseSound(
              notification
            );

            setNotificationsOpen(
              true
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
        },
        async () => {
          await loadOrders(
            false
          );

          if (trashOpen) {
            await loadTrashOrders();
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
          await loadOrders(
            false
          );
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
          await loadQuantityChanges();

          await loadOrders(
            false
          );
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
          await loadProducts();
        }
      );

    realtimeChannel.subscribe(
      (
        status: string
      ) => {
        console.log(
          "ADMIN REALTIME STATUS:",
          status
        );
      }
    );

    return () => {
      mounted =
        false;

      window.clearInterval(
        polling
      );

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
      (
        notification: Notification
      ) =>
        !notification.is_read
    ).length;

  const pendingChanges =
    quantityChanges.filter(
      (
        change: QuantityChange
      ) =>
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
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
          >
            العودة للموقع
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      {/* =====================================================
          تنبيه طلب جديد
      ===================================================== */}

      {newOrderAlert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-green-500 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-7xl">
                🔔
              </div>

              <h2 className="mt-4 text-3xl font-black text-green-700">
                طلب جديد!
              </h2>

              <p className="mt-3 text-lg font-bold text-gray-900">
                وصل طلب جديد من:
              </p>

              <p className="mt-2 text-2xl font-black text-gray-900">
                {
                  newOrderAlert.customer_name
                }
              </p>

              <div className="mt-4 rounded-2xl bg-green-50 p-4">
                <p className="font-bold text-gray-800">
                  رقم الطلب
                </p>

                <p className="mt-1 text-2xl font-black text-green-700">
                  #
                  {
                    newOrderAlert.id
                  }
                </p>

                <p className="mt-3 font-bold text-gray-800">
                  الإجمالي
                </p>

                <p className="mt-1 text-xl font-black text-green-700">
                  {
                    newOrderAlert.total
                  }{" "}
                  جنيه
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={
                    closeNewOrderAlert
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-bold text-gray-900"
                >
                  إغلاق
                </button>

                <a
                  href="#orders"
                  onClick={
                    closeNewOrderAlert
                  }
                  className="rounded-xl bg-green-600 px-4 py-3 text-center font-bold text-white"
                >
                  عرض الطلبات
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-700">
                لوحة تحكم الأدمن
              </h1>

              <p className="text-sm text-gray-600">
                صيدلية الشفاء
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={
                  enableNotificationSound
                }
                className={`rounded-lg px-5 py-2 font-bold ${
                  soundEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-500 text-white"
                }`}
              >
                {soundEnabled
                  ? "🔊 الصوت مفعل"
                  : "🔔 تفعيل صوت التنبيهات"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(
                    true
                  )
                }
                className="relative rounded-lg border border-blue-600 bg-blue-50 px-5 py-2 font-bold text-blue-800"
              >
                🔔 الإشعارات

                {unreadNotifications >
                  0 && (
                  <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
                    {
                      unreadNotifications
                    }
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={
                  openTrash
                }
                className="rounded-lg border border-red-600 bg-red-50 px-5 py-2 font-bold text-red-700"
              >
                🗑️ سلة المحذوفات

                {trashOrders.length >
                  0 && (
                  <span className="mr-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white">
                    {
                      trashOrders.length
                    }
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  loadOrders(
                    true
                  )
                }
                className="rounded-lg bg-green-600 px-5 py-2 font-bold text-white"
              >
                🔄 تحديث
              </button>

              <a
                href="/"
                className="rounded-lg border border-green-600 px-5 py-2 font-bold text-green-700"
              >
                العودة للموقع
              </a>
            </div>
          </div>
        </div>
      </header>

      <section
        id="orders"
        className="mx-auto max-w-6xl px-6 py-10"
      >
        {/* =====================================================
            تعديلات معلقة
        ===================================================== */}

        {pendingChanges.length >
          0 && (
          <div className="mb-8 rounded-2xl border-2 border-orange-300 bg-orange-50 p-5">
            <h2 className="text-xl font-bold text-orange-800">
              ⚠️ تعديلات كمية في انتظار العميل
            </h2>

            <p className="mt-2 text-orange-800">
              يوجد{" "}
              {
                pendingChanges.length
              }{" "}
              تعديل كمية لم تتم الموافقة عليه أو رفضه حتى الآن.
            </p>
          </div>
        )}

        {/* =====================================================
            إدارة الطلبات
        ===================================================== */}

        <div className="mb-8 rounded-2xl border-2 border-red-200 bg-red-50 p-5">
          <h2 className="text-xl font-bold text-red-700">
            🗑️ إدارة الطلبات
          </h2>

          <p className="mt-2 text-sm text-red-700">
            النقل للسلة يخفي الطلب من الأدمن فقط ولا يحذفه من عند العميل.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statusOptions.map(
              (
                status: {
                  value: string;
                  label: string;
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
                      deletingOrderId !==
                        null ||
                      deletingAll ||
                      deletingStatus !==
                        null
                    }
                    className="flex items-center justify-between rounded-xl border border-red-300 bg-white px-4 py-3 font-bold text-red-700 disabled:opacity-50"
                  >
                    <span>
                      🗑️ إخفاء{" "}
                      {
                        status.label
                      }
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
                deletingOrderId !==
                  null ||
                deletingAll ||
                deletingStatus !==
                  null
              }
              className="rounded-xl bg-red-600 px-4 py-3 font-black text-white disabled:opacity-50"
            >
              🗑️ إخفاء كل الطلبات (
              {
                orders.length
              })
            </button>
          </div>
        </div>

        {/* =====================================================
            المخزون
        ===================================================== */}

        <div className="mb-8 rounded-2xl border-2 border-purple-200 bg-purple-50 p-5">
          <h2 className="text-xl font-bold text-purple-700">
            📦 حالة المخزون
          </h2>

          <p className="mt-2 text-sm text-purple-700">
            يتم خصم المخزون عند انتقال الطلب إلى حالة تشغيلية، ويُعاد عند الرجوع إلى "جديد" أو "ملغي".
          </p>
        </div>

        {/* =====================================================
            الطلبات
        ===================================================== */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            الطلبات
          </h2>

          <p className="mt-2 text-gray-600">
            الطلبات الظاهرة حاليًا في لوحة الأدمن
          </p>
        </div>

        {!orders.length ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">
              📦
            </div>

            <h3 className="mt-5 text-2xl font-bold text-gray-800">
              لا توجد طلبات
            </h3>

            <p className="mt-2 text-gray-600">
              عندما يقوم أحد العملاء بعمل طلب سيظهر هنا.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(
              (
                order: Order
              ) => {
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
                    key={
                      order.id
                    }
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-3xl">
                              📦
                            </span>

                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {
                                  order.customer_name
                                }
                              </h3>

                              <p className="text-sm text-gray-600">
                                رقم الطلب:{" "}
                                {
                                  order.id
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 space-y-2 text-gray-800">
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

                            <p
                              className={
                                order.stock_deducted
                                  ? "font-bold text-green-700"
                                  : "font-bold text-gray-700"
                              }
                            >
                              📦{" "}
                              {order.stock_deducted
                                ? "المخزون مخصوم"
                                : "المخزون غير مخصوم"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              hideSingleOrder(
                                order
                              )
                            }
                            disabled={
                              deletingOrderId ===
                                order.id ||
                              deletingAll ||
                              deletingStatus !==
                                null ||
                              savingOrderId ===
                                order.id ||
                              stockUpdatingId ===
                                order.id
                            }
                            className="mt-5 rounded-xl border border-red-500 bg-red-50 px-5 py-2.5 font-bold text-red-700 disabled:opacity-50"
                          >
                            {deletingOrderId ===
                            order.id
                              ? "⏳ جاري النقل..."
                              : "🗑️ نقل إلى سلة المحذوفات"}
                          </button>
                        </div>

                        <div className="w-full rounded-xl bg-gray-50 p-4 lg:w-72">
                          <p className="mb-3 text-sm font-bold text-gray-700">
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
                                order.id ||
                              deletingOrderId ===
                                order.id ||
                              deletingAll ||
                              deletingStatus !==
                                null
                            }
                            onChange={(
                              e
                            ) => {
                              const value =
                                e.target
                                  .value;

                              dirtyStatusRef.current =
                                {
                                  ...dirtyStatusRef.current,
                                  [order.id]:
                                    value,
                                };

                              setDraftStatuses(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [order.id]:
                                    value,
                                })
                              );
                            }}
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-bold text-gray-900"
                          >
                            {statusOptions.map(
                              (
                                status: {
                                  value: string;
                                  label: string;
                                }
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

                          <p className="mt-2 text-center text-sm text-gray-700">
                            الحالة الحالية:{" "}
                            {
                              order.status
                            }
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">
                          🛒 منتجات الطلب
                        </h3>

                        <div className="space-y-4">
                          {items.map(
                            (
                              item: OrderItem
                            ) => {
                              const pendingChange =
                                quantityChanges.find(
                                  (
                                    change: QuantityChange
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

                              const displayedQuantity =
                                quantityValues[
                                  item.id
                                ] ??
                                item.quantity;

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="rounded-2xl border-2 border-gray-100 p-5"
                                >
                                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-1 gap-5">
                                      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-gray-100">
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
                                          <span className="text-5xl">
                                            💊
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex-1">
                                        <h4 className="text-lg font-bold text-gray-900">
                                          {
                                            currentProduct?.name_ar ||
                                            item.product_name
                                          }
                                        </h4>

                                        {currentProduct?.name_en && (
                                          <p className="mt-1 text-sm text-gray-500">
                                            {
                                              currentProduct.name_en
                                            }
                                          </p>
                                        )}

                                        <p className="mt-2 text-gray-700">
                                          السعر:{" "}
                                          {
                                            item.price
                                          }{" "}
                                          جنيه
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-3">
                                          <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">
                                            الكمية الحالية:{" "}
                                            {
                                              item.quantity
                                            }
                                          </span>

                                          <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-800">
                                            الكمية المطلوبة أصلاً:{" "}
                                            {
                                              item.requested_quantity
                                            }
                                          </span>

                                          <span className="rounded-lg bg-purple-50 px-3 py-2 text-sm font-bold text-purple-800">
                                            المخزون الحالي:{" "}
                                            {
                                              currentProduct?.stock ??
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

                                    {canEditQuantity ? (
                                      <div className="w-full rounded-xl bg-orange-50 p-4 lg:w-80">
                                        <p className="mb-3 font-bold text-orange-800">
                                          🔢 تحديد الكمية
                                        </p>

                                        <input
                                          type="number"
                                          min="1"
                                          value={
                                            displayedQuantity
                                          }
                                          disabled={
                                            !!pendingChange ||
                                            savingOrderId ===
                                              order.id
                                          }
                                          onChange={(
                                            e
                                          ) => {
                                            const value =
                                              Number(
                                                e.target
                                                  .value
                                              );

                                            dirtyQuantityRef.current =
                                              {
                                                ...dirtyQuantityRef.current,
                                                [item.id]:
                                                  value,
                                              };

                                            setQuantityValues(
                                              (
                                                current
                                              ) => ({
                                                ...current,
                                                [item.id]:
                                                  value,
                                              })
                                            );

                                            setQuantityTouched(
                                              (
                                                current
                                              ) => ({
                                                ...current,
                                                [item.id]:
                                                  true,
                                              })
                                            );
                                          }}
                                          className="w-full rounded-xl border border-orange-300 bg-white px-4 py-3 text-center text-xl font-black text-gray-900"
                                        />

                                        <button
                                          type="button"
                                          disabled={
                                            !!pendingChange ||
                                            savingOrderId ===
                                              order.id
                                          }
                                          onClick={() => {
                                            const value =
                                              Number(
                                                quantityValues[
                                                  item.id
                                                ] ??
                                                  item.quantity
                                              );

                                            if (
                                              !Number.isInteger(
                                                value
                                              ) ||
                                              value <
                                                1
                                            ) {
                                              alert(
                                                "الكمية غير صحيحة."
                                              );
                                              return;
                                            }

                                            dirtyQuantityRef.current =
                                              {
                                                ...dirtyQuantityRef.current,
                                                [item.id]:
                                                  value,
                                              };

                                            setQuantityValues(
                                              (
                                                current
                                              ) => ({
                                                ...current,
                                                [item.id]:
                                                  value,
                                              })
                                            );

                                            setQuantityTouched(
                                              (
                                                current
                                              ) => ({
                                                ...current,
                                                [item.id]:
                                                  true,
                                              })
                                            );
                                          }}
                                          className="mt-3 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white"
                                        >
                                          📤 تجهيز الكمية للإرسال
                                        </button>

                                        {pendingChange && (
                                          <div className="mt-3 rounded-lg border border-orange-300 bg-white p-3 text-center text-sm font-bold text-orange-800">
                                            ⏳ تم إرسال اقتراح من{" "}
                                            {
                                              pendingChange.old_quantity
                                            }{" "}
                                            إلى{" "}
                                            {
                                              pendingChange.new_quantity
                                            }{" "}
                                            وننتظر رد العميل.
                                          </div>
                                        )}

                                        {!pendingChange &&
                                          item.customer_approval ===
                                            "rejected" && (
                                            <p className="mt-3 text-center text-sm font-bold text-red-700">
                                              ❌ العميل رفض الاقتراح السابق.
                                              <br />
                                              يمكنك إرسال نفس الكمية الأصلية أو كمية جديدة.
                                            </p>
                                          )}
                                      </div>
                                    ) : (
                                      <div className="w-full rounded-xl bg-gray-100 p-4 text-center lg:w-80">
                                        <p className="font-bold text-gray-700">
                                          🔒 تعديل الكمية غير متاح
                                        </p>

                                        <p className="mt-1 text-sm text-gray-600">
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
                      </div>

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
                                type="button"
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
                                className="rounded-xl bg-green-600 px-7 py-3 font-bold text-white disabled:opacity-50"
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

      {/* =====================================================
          نافذة الإشعارات
      ===================================================== */}

      {notificationsOpen && (
        <div className="fixed inset-0 z-[280] bg-black/60 p-3 sm:p-5">
          <div className="mx-auto mt-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:mt-8">
            <div className="flex shrink-0 items-center justify-between border-b p-4 sm:p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  🔔 إشعارات الأدمن
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  لديك{" "}
                  <strong>
                    {
                      unreadNotifications
                    }
                  </strong>{" "}
                  إشعار غير مقروء
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(
                    false
                  )
                }
                className="text-2xl text-gray-700 hover:text-red-600"
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
                    ? "🔊 الصوت مفعل"
                    : "🔔 تفعيل الصوت"}
                </button>

                <button
                  type="button"
                  onClick={
                    markAllNotificationsAsRead
                  }
                  disabled={
                    unreadNotifications ===
                    0
                  }
                  className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                >
                  ✅ تعليم الكل كمقروء
                </button>

                <button
                  type="button"
                  onClick={
                    deleteAllAdminNotifications
                  }
                  disabled={
                    deletingAllNotifications ||
                    notifications.length ===
                      0
                  }
                  className="rounded-xl border border-red-500 bg-white px-4 py-3 font-bold text-red-700 disabled:opacity-50"
                >
                  {deletingAllNotifications
                    ? "⏳ جاري الحذف..."
                    : "🗑️ حذف كل الإشعارات"}
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {!notifications.length ? (
                <div className="rounded-xl bg-gray-50 p-10 text-center">
                  <div className="text-5xl">
                    🔕
                  </div>

                  <p className="mt-4 font-bold text-gray-800">
                    لا توجد إشعارات
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map(
                    (
                      notification: Notification
                    ) => (
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
                            "quantity_response"
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
                                    "ar-EG"
                                  )}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-col gap-2">
                                {!notification.is_read && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAdminNotificationRead(
                                        notification.id
                                      )
                                    }
                                    className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800"
                                  >
                                    ✅ قراءة
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteAdminNotification(
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
                                    : "🗑️ حذف"}
                                </button>
                              </div>
                            </div>
                          </div>
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
          سلة المحذوفات
      ===================================================== */}

      {trashOpen && (
        <div className="fixed inset-0 z-[250] bg-black/60 p-3 sm:p-5">
          <div className="mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b p-4 sm:p-5">
              <div>
                <h2 className="text-xl font-bold text-red-700 sm:text-2xl">
                  🗑️ سلة محذوفات الأدمن
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  الطلبات هنا مخفية من الأدمن فقط، ولا تزال موجودة عند العملاء.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTrashOpen(
                    false
                  )
                }
                className="text-2xl text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 border-b bg-gray-50 p-4">
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
                  ? "⏳ جاري الاسترجاع..."
                  : "♻️ استرجاع الكل"}
              </button>

              <button
                type="button"
                onClick={
                  loadTrashOrders
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-bold text-gray-900"
              >
                🔄 تحديث
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {trashLoading ? (
                <div className="py-12 text-center font-bold text-red-600">
                  جاري تحميل سلة المحذوفات...
                </div>
              ) : !trashOrders.length ? (
                <div className="rounded-2xl bg-gray-50 p-10 text-center">
                  <div className="text-6xl">
                    🗑️
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-gray-800">
                    سلة المحذوفات فارغة
                  </h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {trashOrders.map(
                    (
                      order: Order
                    ) => (
                      <div
                        key={
                          order.id
                        }
                        className="rounded-2xl border-2 border-red-100 bg-red-50 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {
                                order.customer_name
                              }
                            </h3>

                            <p className="mt-1 text-sm text-gray-700">
                              الطلب رقم{" "}
                              {
                                order.id
                              }
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              الحالة:{" "}
                              <strong>
                                {
                                  order.status
                                }
                              </strong>
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              {
                                order.total
                              }{" "}
                              جنيه
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
                              ? "⏳ جاري الاسترجاع..."
                              : "♻️ استرجاع الطلب"}
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
    </main>
  );
}