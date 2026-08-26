"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useLanguage } from "./language-provider";

type Product = {
  id: number;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  price: number;
  stock: number;
  icon: string | null;
  image_url: string | null;
  category: string | null;
};

type CartItem = Product & {
  quantity: number;
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

type RealtimeNotificationPayload = {
  new: Notification;
};

export default function Home() {
  const {
    language,
    toggleLanguage,
    dir,
  } = useLanguage();

  const isArabic =
    language === "ar";

  const t = {
    pharmacyName: isArabic
      ? "صيدلية الشفاء"
      : "Al Shifa Pharmacy",

    priority: isArabic
      ? "صحتك أولويتنا"
      : "Your health is our priority",

    loading: isArabic
      ? "جاري التحميل..."
      : "Loading...",

    login: isArabic
      ? "تسجيل الدخول"
      : "Login",

    logout: isArabic
      ? "تسجيل الخروج"
      : "Logout",

    myOrders: isArabic
      ? "طلباتي"
      : "My Orders",

    notifications: isArabic
      ? "الإشعارات"
      : "Notifications",

    cart: isArabic
      ? "السلة"
      : "Cart",

    languageButton: isArabic
      ? "English"
      : "العربية",

    welcome: isArabic
      ? "أهلاً بك في صيدلية الشفاء 💚"
      : "Welcome to Al Shifa Pharmacy 💚",

    heroText: isArabic
      ? "اطلب أدويتك ومنتجاتك الصحية بسهولة وأمان"
      : "Order your medicines and healthcare products easily and securely",

    searchPlaceholder: isArabic
      ? "ابحث عن دواء أو منتج..."
      : "Search for a medicine or product...",

    search: isArabic
      ? "بحث"
      : "Search",

    notificationUpdates: isArabic
      ? "تحديثات الطلبات وتعديلات الكميات"
      : "Order updates and quantity changes",

    enableSound: isArabic
      ? "🔔 تفعيل الصوت"
      : "🔔 Enable sound",

    soundEnabled: isArabic
      ? "🔊 الصوت مفعل"
      : "🔊 Sound enabled",

    markAllRead: isArabic
      ? "✅ قراءة الكل"
      : "✅ Mark all as read",

    deleteAll: isArabic
      ? "🗑️ حذف الكل"
      : "🗑️ Delete all",

    noNotifications: isArabic
      ? "لا توجد إشعارات"
      : "No notifications",

    new: isArabic
      ? "جديد"
      : "New",

    delete: isArabic
      ? "🗑️ حذف"
      : "🗑️ Delete",

    needApproval: isArabic
      ? "⚠️ مطلوب موافقتك"
      : "⚠️ Your approval is required",

    originalQuantity: isArabic
      ? "الكمية الأصلية"
      : "Original quantity",

    proposedQuantity: isArabic
      ? "الكمية المقترحة"
      : "Proposed quantity",

    approve: isArabic
      ? "✅ موافق"
      : "✅ Approve",

    reject: isArabic
      ? "❌ رفض"
      : "❌ Reject",

    saving: isArabic
      ? "جاري الحفظ..."
      : "Saving...",

    approved: isArabic
      ? "✅ تمت الموافقة على التعديل"
      : "✅ Change approved",

    rejected: isArabic
      ? "❌ تم رفض التعديل"
      : "❌ Change rejected",

    pendingChangesText: isArabic
      ? "تعديل كمية في انتظار موافقتك."
      : "quantity change pending your approval.",

    categories: isArabic
      ? "أقسام الصيدلية"
      : "Pharmacy categories",

    medicines: isArabic
      ? "الأدوية"
      : "Medicines",

    skinCare: isArabic
      ? "العناية بالبشرة"
      : "Skin Care",

    kids: isArabic
      ? "الأطفال"
      : "Kids",

    medicalDevices: isArabic
      ? "الأجهزة الطبية"
      : "Medical Devices",

    products: isArabic
      ? "منتجات الصيدلية"
      : "Pharmacy products",

    availableProducts: isArabic
      ? "المنتجات المتاحة حاليًا"
      : "Currently available products",

    refreshProducts: isArabic
      ? "🔄 تحديث المنتجات"
      : "🔄 Refresh products",

    noProducts: isArabic
      ? "لا توجد منتجات"
      : "No products",

    noDescription: isArabic
      ? "لا يوجد وصف"
      : "No description",

    available: isArabic
      ? "متوفر"
      : "Available",

    unavailable: isArabic
      ? "غير متوفر"
      : "Out of stock",

    addToCart: isArabic
      ? "أضف للسلة 🛒"
      : "Add to cart 🛒",

    rights: isArabic
      ? "جميع الحقوق محفوظة © 2026"
      : "All rights reserved © 2026",

    shoppingCart: isArabic
      ? "🛒 سلة المشتريات"
      : "🛒 Shopping cart",

    emptyCart: isArabic
      ? "السلة فارغة"
      : "Your cart is empty",

    quantity: isArabic
      ? "الكمية"
      : "Quantity",

    total: isArabic
      ? "الإجمالي"
      : "Total",

    cartTotal: isArabic
      ? "إجمالي السلة"
      : "Cart total",

    checkout: isArabic
      ? "إتمام الطلب"
      : "Checkout",

    orderData: isArabic
      ? "📝 بيانات الطلب"
      : "📝 Order details",

    fullName: isArabic
      ? "الاسم بالكامل"
      : "Full name",

    phone: isArabic
      ? "رقم الموبايل"
      : "Phone number",

    address: isArabic
      ? "العنوان"
      : "Address",

    notes: isArabic
      ? "ملاحظات"
      : "Notes",

    orderTotal: isArabic
      ? "إجمالي الطلب"
      : "Order total",

    confirmOrder: isArabic
      ? "تأكيد الطلب ✅"
      : "Confirm order ✅",

    sendingOrder: isArabic
      ? "جاري إرسال الطلب..."
      : "Sending order...",

    availableNow: isArabic
      ? "متوفر:"
      : "Available:",

    loadingProducts: isArabic
      ? "جاري تحميل المنتجات..."
      : "Loading products...",

    loadProductsError: isArabic
      ? "تعذر تحميل المنتجات"
      : "Unable to load products",

    retry: isArabic
      ? "🔄 إعادة المحاولة"
      : "🔄 Try again",

    footerPriority: isArabic
      ? "صحتك أولويتنا 💚"
      : "Your health is our priority 💚",

    close: isArabic
      ? "إغلاق"
      : "Close",

    showNotifications: isArabic
      ? "عرض الإشعارات"
      : "View notifications",

    approvalMessage: isArabic
      ? "⚠️ مطلوب موافقتك"
      : "⚠️ Your approval is required",

    cancel: isArabic
      ? "إلغاء"
      : "Cancel",

    enterName: isArabic
      ? "اكتب اسمك"
      : "Enter your name",

    enterAddress: isArabic
      ? "اكتب عنوان التوصيل بالتفصيل"
      : "Enter the delivery address in detail",

    extraNotes: isArabic
      ? "أي ملاحظات إضافية..."
      : "Any additional notes...",

    enterPassword: isArabic
      ? "اكتب كلمة المرور"
      : "Enter your password",

    searchNoProducts: isArabic
      ? "لا توجد منتجات"
      : "No products found",

    viewOrders: isArabic
      ? "📦 طلباتي"
      : "📦 My Orders",
  };

  const [products, setProducts] =
    useState<Product[]>([]);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [productsError, setProductsError] =
    useState<string | null>(null);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [checkoutOpen, setCheckoutOpen] =
    useState(false);

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [userEmail, setUserEmail] =
    useState<string | null>(null);

  const [userName, setUserName] =
    useState<string | null>(null);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [ordering, setOrdering] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  const [quantityChanges, setQuantityChanges] =
    useState<QuantityChange[]>([]);

  const [respondingChange, setRespondingChange] =
    useState<number | null>(null);

  const [soundEnabled, setSoundEnabled] =
    useState(false);

  const soundEnabledRef =
    useRef(false);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const [newNotificationAlert, setNewNotificationAlert] =
    useState<Notification | null>(null);

  const lastKnownNotificationIdRef =
    useRef<number | null>(null);

  const checkingNotificationsRef =
    useRef(false);

  const locallyDeletedNotificationIdsRef =
    useRef<Set<number>>(
      new Set()
    );

  // =====================================================
  // الصوت
  // =====================================================

  function createAudioContext() {
    if (typeof window === "undefined") {
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

  function playNotificationSound() {
    if (!soundEnabledRef.current) {
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

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(
        800,
        audioContext.currentTime
      );

      oscillator.frequency.setValueAtTime(
        1000,
        audioContext.currentTime + 0.12
      );

      oscillator.frequency.setValueAtTime(
        800,
        audioContext.currentTime + 0.24
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.25,
        audioContext.currentTime + 0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.55
      );

      oscillator.connect(
        gainNode
      );

      gainNode.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.55
      );
    } catch (error) {
      console.error(
        "PLAY NOTIFICATION SOUND ERROR:",
        error
      );
    }
  }

  async function enableNotificationSound() {
    try {
      const audioContext =
        await ensureAudioReady();

      if (!audioContext) {
        alert(
          isArabic
            ? "المتصفح لا يدعم تشغيل صوت التنبيهات."
            : "Your browser does not support notification sounds."
        );
        return;
      }

      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(
        650,
        audioContext.currentTime
      );

      oscillator.frequency.setValueAtTime(
        900,
        audioContext.currentTime + 0.12
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.2,
        audioContext.currentTime + 0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.28
      );

      oscillator.connect(
        gainNode
      );

      gainNode.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.28
      );

      soundEnabledRef.current = true;
      setSoundEnabled(true);
    } catch (error) {
      console.error(
        "ENABLE CUSTOMER SOUND ERROR:",
        error
      );

      alert(
        isArabic
          ? "تعذر تفعيل صوت التنبيهات."
          : "Unable to enable notification sounds."
      );
    }
  }

  // =====================================================
  // المنتجات
  // =====================================================

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError(null);

    try {
      const response =
        await fetch(
          "/api/products",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            (
              isArabic
                ? "حدث خطأ أثناء تحميل المنتجات."
                : "An error occurred while loading products."
            )
        );
      }

      setProducts(
        (result || []) as Product[]
      );
    } catch (error) {
      console.error(
        "LOAD PRODUCTS ERROR:",
        error
      );

      setProducts([]);

      setProductsError(
        error instanceof Error
          ? error.message
          : (
              isArabic
                ? "حدث خطأ أثناء تحميل المنتجات."
                : "An error occurred while loading products."
            )
      );
    } finally {
      setProductsLoading(false);
    }
  }

  // =====================================================
  // الإشعارات
  // =====================================================

  async function loadNotifications(
    currentUserId: string,
    detectNew = false
  ) {
    if (!detectNew) {
      setNotificationsLoading(true);
    }

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from("notifications")
          .select("*")
          .eq(
            "user_id",
            currentUserId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(100);

      if (error) {
        console.error(
          "LOAD NOTIFICATIONS ERROR:",
          error
        );
        return;
      }

      const loaded =
        (data || []) as Notification[];

      const filtered =
        loaded.filter(
          (notification: Notification) =>
            !locallyDeletedNotificationIdsRef.current.has(
              notification.id
            )
        );

      if (
        lastKnownNotificationIdRef.current ===
        null
      ) {
        if (filtered[0]) {
          lastKnownNotificationIdRef.current =
            filtered[0].id;
        }

        setNotifications(
          filtered
        );

        return;
      }

      if (detectNew) {
        const lastId =
          lastKnownNotificationIdRef.current;

        const newNotifications =
          filtered.filter(
            (notification: Notification) =>
              notification.id >
              lastId
          );

        if (
          newNotifications.length >
          0
        ) {
          const sorted =
            [...newNotifications].sort(
              (
                a: Notification,
                b: Notification
              ) =>
                a.id - b.id
            );

          for (
            const notification of
              sorted
          ) {
            handleIncomingNotification(
              notification
            );

            lastKnownNotificationIdRef.current =
              Math.max(
                lastKnownNotificationIdRef.current ?? 0,
                notification.id
              );
          }

          await loadQuantityChanges(
            currentUserId
          );
        }
      }

      setNotifications(
        filtered
      );
    } catch (error) {
      console.error(
        "NOTIFICATIONS ERROR:",
        error
      );
    } finally {
      if (!detectNew) {
        setNotificationsLoading(
          false
        );
      }
    }
  }

  function handleIncomingNotification(
    notification: Notification
  ) {
    if (
      locallyDeletedNotificationIdsRef.current.has(
        notification.id
      )
    ) {
      return;
    }

    setNotifications(
      (current: Notification[]) => {
        if (
          current.some(
            (item: Notification) =>
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

    const lastId =
      lastKnownNotificationIdRef.current;

    if (
      lastId === null ||
      notification.id > lastId
    ) {
      lastKnownNotificationIdRef.current =
        notification.id;

      setNewNotificationAlert(
        notification
      );

      playNotificationSound();
    }
  }

  // =====================================================
  // فحص تلقائي للإشعارات
  // =====================================================

  async function checkCustomerNotifications() {
    if (
      !userId ||
      checkingNotificationsRef.current
    ) {
      return;
    }

    checkingNotificationsRef.current =
      true;

    try {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session?.access_token) {
        return;
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
              action:
                "load_all",
            }),
            cache: "no-store",
          }
        );

      if (!response.ok) {
        return;
      }

      const result =
        await response.json();

      const incoming =
        (
          result.notifications ||
          []
        ) as Notification[];

      const filtered =
        incoming.filter(
          (notification: Notification) =>
            !locallyDeletedNotificationIdsRef.current.has(
              notification.id
            )
        );

      if (
        lastKnownNotificationIdRef.current ===
        null
      ) {
        if (filtered[0]) {
          lastKnownNotificationIdRef.current =
            filtered[0].id;
        }

        setNotifications(
          filtered
        );

        return;
      }

      const lastId =
        lastKnownNotificationIdRef.current;

      const newNotifications =
        filtered.filter(
          (notification: Notification) =>
            notification.id >
            lastId
        );

      if (
        newNotifications.length >
        0
      ) {
        const sorted =
          [...newNotifications].sort(
            (
              a: Notification,
              b: Notification
            ) =>
              a.id - b.id
          );

        for (
          const notification of
            sorted
        ) {
          handleIncomingNotification(
            notification
          );

          lastKnownNotificationIdRef.current =
            Math.max(
              lastKnownNotificationIdRef.current ?? 0,
              notification.id
            );
        }

        await loadQuantityChanges(
          userId
        );
      } else {
        setNotifications(
          filtered
        );
      }
    } catch (error) {
      console.error(
        "CUSTOMER NOTIFICATION POLLING ERROR:",
        error
      );
    } finally {
      checkingNotificationsRef.current =
        false;
    }
  }

  // =====================================================
  // تغييرات الكمية
  // =====================================================

  async function loadQuantityChanges(
    currentUserId: string
  ) {
    try {
      const {
        data: orders,
        error: ordersError,
      } =
        await supabase
          .from("orders")
          .select("id")
          .eq(
            "user_id",
            currentUserId
          );

      if (
        ordersError ||
        !orders?.length
      ) {
        setQuantityChanges([]);
        return;
      }

      const orderIds =
        orders.map(
          (order: { id: number }) =>
            order.id
        );

      const {
        data,
        error,
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
    } catch (error) {
      console.error(
        "QUANTITY CHANGES ERROR:",
        error
      );
    }
  }

  // =====================================================
  // المستخدم + متابعة جلسة Supabase
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          console.error(
            "LOAD SESSION ERROR:",
            sessionError
          );

          setUserId(null);
          setUserEmail(null);
          setUserName(null);
          setNotifications([]);
          setQuantityChanges([]);
          return;
        }

        if (!session?.user) {
          setUserId(null);
          setUserEmail(null);
          setUserName(null);
          setNotifications([]);
          setQuantityChanges([]);
          return;
        }

        const user =
          session.user;

        setUserId(user.id);

        setUserEmail(
          user.email ?? null
        );

        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          null;

        setUserName(name);

        await Promise.all([
          loadNotifications(
            user.id,
            false
          ),
          loadQuantityChanges(
            user.id
          ),
        ]);
      } catch (error) {
        console.error(
          "LOAD USER ERROR:",
          error
        );

        if (mounted) {
          setUserId(null);
          setUserEmail(null);
          setUserName(null);
          setNotifications([]);
          setQuantityChanges([]);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();
    loadProducts();

    // ===================================================
    // متابعة حالة Auth
    // مهم:
    // لا ننفذ استدعاءات Supabase مباشرة داخل callback
    // لتجنب تعليق Supabase Auth.
    // ===================================================

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "AUTH STATE CHANGE:",
            event
          );

          if (
            event ===
            "SIGNED_OUT"
          ) {
            setUserId(null);
            setUserEmail(null);
            setUserName(null);
            setNotifications([]);
            setQuantityChanges([]);
            setNewNotificationAlert(
              null
            );

            lastKnownNotificationIdRef.current =
              null;

            locallyDeletedNotificationIdsRef.current.clear();

            return;
          }

          if (
            event ===
              "SIGNED_IN" ||
            event ===
              "TOKEN_REFRESHED" ||
            event ===
              "INITIAL_SESSION"
          ) {
            if (!session?.user) {
              return;
            }

            const user =
              session.user;

            setUserId(
              user.id
            );

            setUserEmail(
              user.email ??
                null
            );

            const name =
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              null;

            setUserName(
              name
            );

            // ننتظر انتهاء callback أولًا
            // ثم نحمّل بيانات Supabase.
            window.setTimeout(
              () => {
                if (!mounted) {
                  return;
                }

                Promise.all([
                  loadNotifications(
                    user.id,
                    false
                  ),
                  loadQuantityChanges(
                    user.id
                  ),
                ]).catch(
                  (error) => {
                    console.error(
                      "AUTH DATA LOAD ERROR:",
                      error
                    );
                  }
                );
              },
              0
            );
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // تحديث تلقائي
  // =====================================================

  useEffect(() => {
    if (!userId) {
      return;
    }

    checkCustomerNotifications();

    const interval =
      window.setInterval(
        () => {
          checkCustomerNotifications();
        },
        2000
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
      supabase
        .channel(
          `customer-live-${userId}`
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
            filter:
              `user_id=eq.${userId}`,
          },
          async (
            payload: RealtimeNotificationPayload
          ) => {
            const notification =
              payload.new;

            handleIncomingNotification(
              notification
            );

            if (
              notification.type ===
              "quantity_change"
            ) {
              await loadQuantityChanges(
                userId
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
          async () => {
            await loadNotifications(
              userId,
              false
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
          async () => {
            await loadNotifications(
              userId,
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
            await loadQuantityChanges(
              userId
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
              "orders",
            filter:
              `user_id=eq.${userId}`,
          },
          async () => {
            await checkCustomerNotifications();

            await loadQuantityChanges(
              userId
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
        )
        .subscribe(
          (status) => {
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
    const { error } =
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
    setUserEmail(null);
    setUserName(null);
    setNotifications([]);
    setQuantityChanges([]);
    setNewNotificationAlert(null);

    lastKnownNotificationIdRef.current =
      null;

    locallyDeletedNotificationIdsRef.current.clear();

    alert(
      isArabic
        ? "تم تسجيل الخروج بنجاح 👋"
        : "You have been signed out successfully 👋"
    );
  }

  // =====================================================
  // قراءة إشعار
  // =====================================================

  async function markNotificationAsRead(
    notificationId: number
  ) {
    if (!userId) {
      return;
    }

    const { error } =
      await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq(
          "id",
          notificationId
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "MARK NOTIFICATION ERROR:",
        error
      );
      return;
    }

    setNotifications(
      (current: Notification[]) =>
        current.map(
          (notification: Notification) =>
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
  // قراءة الكل
  // =====================================================

  async function markAllNotificationsAsRead() {
    if (!userId) {
      return;
    }

    const unreadIds =
      notifications
        .filter(
          (notification: Notification) =>
            !notification.is_read
        )
        .map(
          (notification: Notification) =>
            notification.id
        );

    if (!unreadIds.length) {
      return;
    }

    const { error } =
      await supabase
        .from("notifications")
        .update({
          is_read: true,
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
          ? "حدث خطأ أثناء تحديث الإشعارات."
          : "An error occurred while updating notifications."
      );
      return;
    }

    setNotifications(
      (current: Notification[]) =>
        current.map(
          (notification: Notification) => ({
            ...notification,
            is_read: true,
          })
        )
    );
  }

  // =====================================================
  // حذف إشعار واحد
  // =====================================================

  async function deleteNotification(
    notificationId: number
  ) {
    if (!userId) {
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

    locallyDeletedNotificationIdsRef.current.add(
      notificationId
    );

    setNotifications(
      (current: Notification[]) =>
        current.filter(
          (notification: Notification) =>
            notification.id !==
            notificationId
        )
    );

    if (
      newNotificationAlert?.id ===
      notificationId
    ) {
      setNewNotificationAlert(null);
    }

    const { error } =
      await supabase
        .from("notifications")
        .delete()
        .eq(
          "id",
          notificationId
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "DELETE NOTIFICATION ERROR:",
        error
      );

      locallyDeletedNotificationIdsRef.current.delete(
        notificationId
      );

      await loadNotifications(
        userId,
        false
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
  }

  // =====================================================
  // حذف الكل
  // =====================================================

  async function deleteAllNotifications() {
    if (
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

    const ids =
      notifications.map(
        (notification: Notification) =>
          notification.id
      );

    ids.forEach(
      (id) =>
        locallyDeletedNotificationIdsRef.current.add(
          id
        )
    );

    setNotifications([]);
    setNewNotificationAlert(null);

    const { error } =
      await supabase
        .from("notifications")
        .delete()
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "DELETE ALL NOTIFICATIONS ERROR:",
        error
      );

      ids.forEach(
        (id) =>
          locallyDeletedNotificationIdsRef.current.delete(
            id
          )
      );

      await loadNotifications(
        userId,
        false
      );

      alert(
        isArabic
          ? "فشل حذف الإشعارات:\n" +
              error.message
          : "Failed to delete notifications:\n" +
              error.message
      );

      return;
    }
  }

  // =====================================================
  // إشعار الأدمن
  // =====================================================

  async function notifyAdmins(
    orderId: number,
    orderItemId: number,
    title: string,
    message: string
  ) {
    try {
      const { error } =
        await supabase.rpc(
          "notify_admins",
          {
            p_order_id:
              orderId,
            p_order_item_id:
              orderItemId,
            p_title:
              title,
            p_message:
              message,
          }
        );

      if (error) {
        console.error(
          "NOTIFY ADMINS RPC ERROR:",
          error
        );
      }
    } catch (error) {
      console.error(
        "NOTIFY ADMINS ERROR:",
        error
      );
    }
  }

  // =====================================================
  // الموافقة / الرفض
  // =====================================================

  async function respondToQuantityChange(
    change: QuantityChange,
    approved: boolean
  ) {
    if (
      respondingChange ===
      change.id
    ) {
      return;
    }

    setRespondingChange(
      change.id
    );

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          isArabic
            ? "يجب تسجيل الدخول أولاً."
            : "You must log in first."
        );
        return;
      }

      const {
        data: order,
        error: orderError,
      } =
        await supabase
          .from("orders")
          .select("id,user_id")
          .eq(
            "id",
            change.order_id
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
        alert(
          isArabic
            ? "لا يمكن تنفيذ هذا التعديل."
            : "This quantity change cannot be processed."
        );
        return;
      }

      const {
        data: currentChange,
        error:
          changeError,
      } =
        await supabase
          .from(
            "order_quantity_changes"
          )
          .select("*")
          .eq(
            "id",
            change.id
          )
          .eq(
            "order_id",
            change.order_id
          )
          .eq(
            "status",
            "pending"
          )
          .maybeSingle();

      if (changeError) {
        alert(
          isArabic
            ? "حدث خطأ أثناء التحقق من التعديل:\n" +
                changeError.message
            : "An error occurred while checking the quantity change:\n" +
                changeError.message
        );
        return;
      }

      if (!currentChange) {
        alert(
          isArabic
            ? "هذا التعديل تم التعامل معه بالفعل."
            : "This quantity change has already been handled."
        );

        await loadQuantityChanges(
          user.id
        );

        return;
      }

      const { data: item } =
        await supabase
          .from("order_items")
          .select("*")
          .eq(
            "id",
            change.order_item_id
          )
          .eq(
            "order_id",
            change.order_id
          )
          .maybeSingle();

      if (!item) {
        alert(
          isArabic
            ? "تعذر العثور على المنتج داخل الطلب."
            : "The product could not be found inside the order."
        );
        return;
      }

      const newStatus =
        approved
          ? "approved"
          : "rejected";

      const finalQuantity =
        approved
          ? Number(
              currentChange.new_quantity
            )
          : Number(
              currentChange.old_quantity
            );

      const responseTime =
        new Date().toISOString();

      const {
        error:
          updateItemError,
      } =
        await supabase
          .from("order_items")
          .update({
            quantity:
              finalQuantity,
            approved_quantity:
              finalQuantity,
            customer_approval:
              newStatus,
            approval_message:
              approved
                ? `وافق العميل على تعديل الكمية إلى ${currentChange.new_quantity}.`
                : `رفض العميل تعديل الكمية، وتم الاحتفاظ بالكمية الأصلية ${currentChange.old_quantity}.`,
          })
          .eq(
            "id",
            change.order_item_id
          )
          .eq(
            "order_id",
            change.order_id
          );

      if (updateItemError) {
        alert(
          isArabic
            ? "فشل تحديث المنتج:\n" +
                updateItemError.message
            : "Failed to update product:\n" +
                updateItemError.message
        );
        return;
      }

      const {
        error:
          updateChangeError,
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
            change.id
          )
          .eq(
            "status",
            "pending"
          );

      if (updateChangeError) {
        alert(
          isArabic
            ? "فشل حفظ رد العميل:\n" +
                updateChangeError.message
            : "Failed to save your response:\n" +
                updateChangeError.message
        );
        return;
      }

      const {
        data: allItems,
      } =
        await supabase
          .from("order_items")
          .select(
            "price,quantity"
          )
          .eq(
            "order_id",
            change.order_id
          );

      const newTotal =
        (allItems || []).reduce(
          (
            sum: number,
            orderItem: {
              price: number | string;
              quantity: number | string;
            }
          ) =>
            sum +
            Number(
              orderItem.price
            ) *
              Number(
                orderItem.quantity
              ),
          0
        );

      await supabase
        .from("orders")
        .update({
          total:
            newTotal,
        })
        .eq(
          "id",
          change.order_id
        )
        .eq(
          "user_id",
          user.id
        );

      if (approved) {
        await notifyAdmins(
          change.order_id,
          change.order_item_id,
          "العميل وافق على تعديل الكمية ✅",
          `العميل وافق على تعديل الكمية من ${currentChange.old_quantity} إلى ${currentChange.new_quantity} في الطلب رقم ${change.order_id}.`
        );

        alert(
          isArabic
            ? `تمت الموافقة بنجاح ✅\n\nالكمية المعتمدة: ${finalQuantity}`
            : `Approved successfully ✅\n\nApproved quantity: ${finalQuantity}`
        );
      } else {
        await notifyAdmins(
          change.order_id,
          change.order_item_id,
          "العميل رفض تعديل الكمية ❌",
          `العميل رفض تعديل الكمية من ${currentChange.old_quantity} إلى ${currentChange.new_quantity} في الطلب رقم ${change.order_id}.`
        );

        alert(
          isArabic
            ? `تم رفض تعديل الكمية ❌\n\nتم الاحتفاظ بالكمية الأصلية: ${finalQuantity}`
            : `Quantity change rejected ❌\n\nOriginal quantity kept: ${finalQuantity}`
        );
      }

      await Promise.all([
        loadQuantityChanges(
          user.id
        ),
        loadNotifications(
          user.id,
          false
        ),
      ]);
    } catch (error) {
      console.error(
        "RESPOND QUANTITY CHANGE ERROR:",
        error
      );

      alert(
        isArabic
          ? "حدث خطأ أثناء إرسال ردك."
          : "An error occurred while sending your response."
      );
    } finally {
      setRespondingChange(
        null
      );
    }
  }

  // =====================================================
  // السلة
  // =====================================================

  function addToCart(
    product: Product
  ) {
    if (product.stock <= 0) {
      alert(
        isArabic
          ? "هذا المنتج غير متوفر حاليًا."
          : "This product is currently out of stock."
      );
      return;
    }

    setCart(
      (currentCart: CartItem[]) => {
        const existing =
          currentCart.find(
            (item: CartItem) =>
              item.id ===
              product.id
          );

        if (existing) {
          if (
            existing.quantity >=
            product.stock
          ) {
            alert(
              isArabic
                ? `الكمية المتاحة من ${product.name_ar} هي ${product.stock} فقط.`
                : `Only ${product.stock} units of ${product.name_en || product.name_ar} are available.`
            );

            return currentCart;
          }

          return currentCart.map(
            (item: CartItem) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    stock:
                      product.stock,
                    price:
                      product.price,
                    name_ar:
                      product.name_ar,
                    name_en:
                      product.name_en,
                    image_url:
                      product.image_url,
                    category:
                      product.category,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          );
        }

        return [
          ...currentCart,
          {
            ...product,
            quantity: 1,
          },
        ];
      }
    );
  }

  function increaseQuantity(
    id: number
  ) {
    setCart(
      (currentCart: CartItem[]) =>
        currentCart.map(
          (item: CartItem) => {
            if (
              item.id !== id
            ) {
              return item;
            }

            if (
              item.quantity >=
              item.stock
            ) {
              alert(
                isArabic
                  ? `لا يمكن زيادة الكمية.\nالمتاح من ${item.name_ar} هو ${item.stock} فقط.`
                  : `The quantity cannot be increased.\nAvailable: ${item.stock} units.`
              );

              return item;
            }

            return {
              ...item,
              quantity:
                item.quantity +
                1,
            };
          }
        )
    );
  }

  function decreaseQuantity(
    id: number
  ) {
    setCart(
      (currentCart: CartItem[]) =>
        currentCart
          .map(
            (item: CartItem) =>
              item.id ===
              id
                ? {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  }
                : item
          )
          .filter(
            (item: CartItem) =>
              item.quantity >
              0
          )
    );
  }

  const cartCount =
    cart.reduce(
      (
        total: number,
        item: CartItem
      ) =>
        total +
        item.quantity,
      0
    );

  const cartTotal =
    cart.reduce(
      (
        total: number,
        item: CartItem
      ) =>
        total +
        item.price *
          item.quantity,
      0
    );

  const unreadNotifications =
    notifications.filter(
      (notification: Notification) =>
        !notification.is_read
    ).length;

  const pendingQuantityChanges =
    quantityChanges.filter(
      (change: QuantityChange) =>
        change.status ===
        "pending"
    );

  const filteredProducts =
    products.filter(
      (product: Product) => {
        const searchText =
          search
            .trim()
            .toLowerCase();

        if (!searchText) {
          return true;
        }

        return (
          product.name_ar
            .toLowerCase()
            .includes(
              searchText
            ) ||
          (
            product.name_en ||
            ""
          )
            .toLowerCase()
            .includes(
              searchText
            ) ||
          (
            product.description ||
            ""
          )
            .toLowerCase()
            .includes(
              searchText
            )
        );
      }
    );

  function openCheckout() {
    if (!userId) {
      alert(
        isArabic
          ? "يجب تسجيل الدخول أولاً لإتمام الطلب."
          : "You must log in first to complete the order."
      );
      return;
    }

    if (!cart.length) {
      alert(
        isArabic
          ? "السلة فارغة، أضف منتج أولاً"
          : "Your cart is empty. Add a product first."
      );
      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  }

  async function confirmOrder() {
    if (ordering) {
      return;
    }

    if (
      !customerName.trim() ||
      !phone.trim() ||
      !address.trim()
    ) {
      alert(
        isArabic
          ? "من فضلك املأ الاسم ورقم الهاتف والعنوان"
          : "Please fill in your name, phone number, and address."
      );
      return;
    }

    if (!cart.length) {
      alert(
        isArabic
          ? "السلة فارغة"
          : "Your cart is empty."
      );
      return;
    }

    setOrdering(true);

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          isArabic
            ? "يجب تسجيل الدخول أولاً لإتمام الطلب"
            : "You must log in first to complete the order."
        );

        setCheckoutOpen(false);
        return;
      }

      const productIds =
        cart.map(
          (item: CartItem) =>
            item.id
        );

      const {
        data:
          latestProducts,
        error:
          stockError,
      } =
        await supabase
          .from("products")
          .select(
            "id,name_ar,name_en,price,stock,description,icon,image_url,category"
          )
          .in(
            "id",
            productIds
          );

      if (stockError) {
        alert(
          isArabic
            ? "حدث خطأ أثناء التأكد من المخزون."
            : "An error occurred while checking stock."
        );
        return;
      }

      for (
        const cartItem of cart
      ) {
        const latest =
          latestProducts?.find(
            (product: Product) =>
              product.id ===
              cartItem.id
          );

        if (!latest) {
          alert(
            isArabic
              ? `المنتج "${cartItem.name_ar}" لم يعد موجودًا.`
              : `The product "${cartItem.name_en || cartItem.name_ar}" is no longer available.`
          );
          return;
        }

        if (
          latest.stock <
          cartItem.quantity
        ) {
          alert(
            isArabic
              ? `المنتج "${latest.name_ar}" متوفر منه ${latest.stock} فقط.\n\nأنت طلبت ${cartItem.quantity}.`
              : `Only ${latest.stock} units of "${latest.name_en || latest.name_ar}" are available.\n\nYou requested ${cartItem.quantity}.`
          );

          await loadProducts();
          return;
        }
      }

      const {
        data: order,
        error: orderError,
      } =
        await supabase
          .from("orders")
          .insert({
            user_id:
              user.id,
            customer_name:
              customerName.trim(),
            phone:
              phone.trim(),
            address:
              address.trim(),
            notes:
              notes.trim() ||
              null,
            total:
              cartTotal,
            status:
              "جديد",
          })
          .select("id")
          .single();

      if (orderError) {
        alert(
          isArabic
            ? "حدث خطأ أثناء إنشاء الطلب:\n\n" +
                orderError.message
            : "An error occurred while creating the order:\n\n" +
                orderError.message
        );
        return;
      }

      if (!order) {
        alert(
          isArabic
            ? "تم إنشاء الطلب ولكن لم يتم الحصول على رقم الطلب."
            : "The order was created, but the order number was not returned."
        );
        return;
      }

      const orderItems =
        cart.map(
          (item: CartItem) => ({
            order_id:
              order.id,
            product_id:
              item.id,
            product_name:
              item.name_ar,
            price:
              item.price,
            requested_quantity:
              item.quantity,
            approved_quantity:
              item.quantity,
            quantity:
              item.quantity,
            customer_approval:
              null,
            approval_message:
              null,
          })
        );

      const { error: itemsError } =
        await supabase
          .from(
            "order_items"
          )
          .insert(
            orderItems
          );

      if (itemsError) {
        alert(
          isArabic
            ? "حدث خطأ في حفظ تفاصيل المنتجات:\n\n" +
                itemsError.message
            : "An error occurred while saving the order items:\n\n" +
                itemsError.message
        );

        await supabase
          .from("orders")
          .delete()
          .eq(
            "id",
            order.id
          )
          .eq(
            "user_id",
            user.id
          );

        return;
      }

      setCart([]);
      setCheckoutOpen(false);

      setCustomerName("");
      setPhone("");
      setAddress("");
      setNotes("");

      alert(
        isArabic
          ? "تم استلام طلبك بنجاح يا " +
              customerName.trim() +
              " 🎉\n\n" +
              "رقم الطلب: " +
              order.id +
              "\n" +
              "الإجمالي: " +
              cartTotal +
              " جنيه"
          : "Your order was received successfully, " +
              customerName.trim() +
              " 🎉\n\n" +
              "Order number: " +
              order.id +
              "\n" +
              "Total: " +
              cartTotal +
              " EGP"
      );

      await loadProducts();
    } catch (error) {
      console.error(
        "CONFIRM ORDER ERROR:",
        error
      );

      alert(
        isArabic
          ? "حدث خطأ غير متوقع."
          : "An unexpected error occurred."
      );
    } finally {
      setOrdering(false);
    }
  }

  // =====================================================
  // Loading
  // =====================================================

  if (productsLoading) {
    return (
      <main
        dir={dir}
        className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            💊
          </div>

          <h1 className="mt-4 text-2xl font-bold text-green-700">
            {t.pharmacyName}
          </h1>

          <p className="mt-4 text-lg font-bold text-gray-800">
            {t.loadingProducts}
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // Products Error
  // =====================================================

  if (productsError) {
    return (
      <main
        dir={dir}
        className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4"
      >
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-lg">
          <div className="text-6xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-bold text-red-600">
            {t.loadProductsError}
          </h1>

          <div
            dir="ltr"
            className="mt-5 rounded-xl bg-red-50 p-4 text-left text-sm text-red-700"
          >
            {productsError}
          </div>

          <button
            onClick={
              loadProducts
            }
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
          >
            {t.retry}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={dir}
      className="min-h-[100dvh] bg-gray-50"
    >
      {/* =====================================================
          إشعار جديد
      ===================================================== */}

      {newNotificationAlert && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-blue-500 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-7xl">
                🔔
              </div>

              <h2 className="mt-4 text-3xl font-black text-blue-700">
                {isArabic
                  ? "إشعار جديد!"
                  : "New notification!"}
              </h2>

              <h3 className="mt-4 text-xl font-bold text-gray-800">
                {
                  newNotificationAlert.title
                }
              </h3>

              <p className="mt-3 text-gray-700">
                {
                  newNotificationAlert.message
                }
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setNewNotificationAlert(
                      null
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-bold text-gray-800"
                >
                  {t.close}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(
                      true
                    );

                    setNewNotificationAlert(
                      null
                    );
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                >
                  {t.showNotifications}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Header
      ===================================================== */}

      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-center sm:text-right">
            <h1 className="text-2xl font-bold text-green-700">
              {t.pharmacyName}
            </h1>

            <p className="text-sm text-gray-600">
              {t.priority}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={
                toggleLanguage
              }
              className="rounded-lg border border-purple-600 bg-white px-3 py-2 text-sm font-bold text-purple-700 shadow-sm hover:bg-purple-50"
            >
              🌐 {t.languageButton}
            </button>

            {loadingUser ? (
              <div className="rounded-lg border px-4 py-2 text-sm text-gray-500">
                {t.loading}
              </div>
            ) : userEmail ? (
              <>
                <a
                  href="/orders"
                  className="rounded-lg border border-green-600 px-3 py-2 text-sm font-semibold text-green-700"
                >
                  {t.myOrders}
                </a>

                <button
                  onClick={() =>
                    setNotificationsOpen(
                      true
                    )
                  }
                  className="relative rounded-lg border border-blue-500 px-3 py-2 text-sm font-semibold text-blue-600"
                >
                  {t.notifications}

                  {unreadNotifications >
                    0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {
                        unreadNotifications
                      }
                    </span>
                  )}
                </button>

                <button
                  onClick={
                    handleLogout
                  }
                  className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700"
              >
                👤 {t.login}
              </a>
            )}

            <button
              onClick={() =>
                setCartOpen(true)
              }
              className="relative rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {t.cart}

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          Hero
      ===================================================== */}

      <section className="w-full bg-green-700 px-4 py-10 text-center text-white">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {t.welcome}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-green-100">
          {t.heroText}
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder={
              t.searchPlaceholder
            }
            className="min-w-0 flex-1 px-4 py-3 text-right text-sm text-gray-900 outline-none"
          />

          <button
            type="button"
            className="bg-green-600 px-5 py-3 font-semibold text-white"
          >
            {t.search} 🔎
          </button>
        </div>
      </section>

      {/* =====================================================
          Notifications
      ===================================================== */}

      {notificationsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 p-3">
          <div className="mx-auto mt-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {t.notifications}
                </h2>

                <p className="mt-1 text-xs text-gray-600">
                  {t.notificationUpdates}
                </p>
              </div>

              <button
                onClick={() =>
                  setNotificationsOpen(
                    false
                  )
                }
                className="text-2xl text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="border-b bg-gray-50 p-3">
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
                    : t.enableSound}
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
                  {t.markAllRead}
                </button>

                <button
                  type="button"
                  onClick={
                    deleteAllNotifications
                  }
                  disabled={
                    !notifications.length
                  }
                  className="rounded-xl border border-red-500 bg-white px-4 py-3 font-bold text-red-600 disabled:opacity-50"
                >
                  {t.deleteAll}
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {notificationsLoading ? (
                <div className="py-10 text-center font-bold text-green-700">
                  {t.loading}
                </div>
              ) : !notifications.length ? (
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
                            <div className="text-2xl">
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
                                  <h3 className="break-words font-bold text-gray-800">
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
                                        markNotificationAsRead(
                                          notification.id
                                        )
                                      }
                                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700"
                                    >
                                      {t.new}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteNotification(
                                        notification.id
                                      )
                                    }
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600"
                                  >
                                    {t.delete}
                                  </button>
                                </div>
                              </div>

                              {isQuantityNotification &&
                                relatedChange &&
                                relatedChange.status ===
                                  "pending" && (
                                  <div className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
                                    <p className="font-bold text-orange-700">
                                      {t.approvalMessage}
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                      <div className="rounded-lg bg-white p-3 text-center">
                                        <p className="text-xs text-gray-600">
                                          {t.originalQuantity}
                                        </p>

                                        <p className="text-2xl font-black text-blue-700">
                                          {
                                            relatedChange.old_quantity
                                          }
                                        </p>
                                      </div>

                                      <div className="rounded-lg bg-white p-3 text-center">
                                        <p className="text-xs text-gray-600">
                                          {t.proposedQuantity}
                                        </p>

                                        <p className="text-2xl font-black text-orange-600">
                                          {
                                            relatedChange.new_quantity
                                          }
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                      <button
                                        onClick={() =>
                                          respondToQuantityChange(
                                            relatedChange,
                                            true
                                          )
                                        }
                                        disabled={
                                          respondingChange ===
                                          relatedChange.id
                                        }
                                        className="flex-1 rounded-xl bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                                      >
                                        {respondingChange ===
                                        relatedChange.id
                                          ? t.saving
                                          : t.approve}
                                      </button>

                                      <button
                                        onClick={() =>
                                          respondToQuantityChange(
                                            relatedChange,
                                            false
                                          )
                                        }
                                        disabled={
                                          respondingChange ===
                                          relatedChange.id
                                        }
                                        className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                                      >
                                        {respondingChange ===
                                        relatedChange.id
                                          ? t.saving
                                          : t.reject}
                                      </button>
                                    </div>
                                  </div>
                                )}

                              {isQuantityNotification &&
                                relatedChange?.status ===
                                  "approved" && (
                                  <div className="mt-4 rounded-xl border-2 border-green-300 bg-green-50 p-3 text-center font-bold text-green-700">
                                    {t.approved}
                                  </div>
                                )}

                              {isQuantityNotification &&
                                relatedChange?.status ===
                                  "rejected" && (
                                  <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center font-bold text-red-700">
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

              {pendingQuantityChanges.length >
                0 && (
                <div className="mt-4 rounded-xl bg-orange-50 p-4 text-center font-bold text-orange-700">
                  {isArabic
                    ? `يوجد ${pendingQuantityChanges.length} تعديل كمية في انتظار موافقتك.`
                    : `${pendingQuantityChanges.length} ${t.pendingChangesText}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Categories
      ===================================================== */}

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">
          {t.categories}
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link
            href="/category/medicines"
            className="rounded-2xl bg-white p-6 text-center shadow-sm"
          >
            <div className="text-5xl">
              💊
            </div>

            <h3 className="mt-4 font-bold text-gray-800">
              {t.medicines}
            </h3>
          </Link>

          <Link
            href="/category/skin-care"
            className="rounded-2xl bg-white p-6 text-center shadow-sm"
          >
            <div className="text-5xl">
              🧴
            </div>

            <h3 className="mt-4 font-bold text-gray-800">
              {t.skinCare}
            </h3>
          </Link>

          <Link
            href="/category/kids"
            className="rounded-2xl bg-white p-6 text-center shadow-sm"
          >
            <div className="text-5xl">
              🍼
            </div>

            <h3 className="mt-4 font-bold text-gray-800">
              {t.kids}
            </h3>
          </Link>

          <Link
            href="/category/medical-devices"
            className="rounded-2xl bg-white p-6 text-center shadow-sm"
          >
            <div className="text-5xl">
              🩺
            </div>

            <h3 className="mt-4 font-bold text-gray-800">
              {t.medicalDevices}
            </h3>
          </Link>
        </div>
      </section>

      {/* =====================================================
          Products
      ===================================================== */}

      <section className="w-full bg-white px-4 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t.products}
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                {t.availableProducts}
              </p>
            </div>

            <button
              onClick={
                loadProducts
              }
              className="rounded-xl border border-green-600 px-5 py-2 font-bold text-green-700"
            >
              {t.refreshProducts}
            </button>
          </div>

          {!filteredProducts.length ? (
            <div className="rounded-2xl bg-gray-50 py-16 text-center">
              <div className="text-6xl">
                📦
              </div>

              <h3 className="mt-5 text-2xl font-bold text-gray-800">
                {t.noProducts}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {filteredProducts.map(
                (product: Product) => (
                  <div
                    key={
                      product.id
                    }
                    className="rounded-2xl border bg-white p-3 shadow-sm sm:p-5"
                  >
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-green-50">
                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name_ar
                          }
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-6xl">
                          {
                            product.icon ||
                            "💊"
                          }
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-bold text-gray-800">
                      {
                        isArabic
                          ? product.name_ar
                          : product.name_en ||
                            product.name_ar
                      }
                    </h3>

                    {product.name_en && (
                      <p
                        dir="ltr"
                        className="mt-1 text-xs text-gray-600"
                      >
                        {
                          isArabic
                            ? product.name_en
                            : product.name_ar
                        }
                      </p>
                    )}

                    <p className="mt-2 text-sm text-gray-700">
                      {
                        product.description ||
                        t.noDescription
                      }
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-green-700">
                        {
                          product.price
                        }{" "}
                        {isArabic
                          ? "جنيه"
                          : "EGP"}
                      </span>

                      <span className="text-xs font-bold text-gray-700">
                        {product.stock > 0
                          ? `${t.availableNow} ${product.stock}`
                          : t.unavailable}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        addToCart(
                          product
                        )
                      }
                      disabled={
                        product.stock <= 0
                      }
                      className="mt-4 w-full rounded-xl bg-green-600 px-3 py-3 font-bold text-white disabled:bg-gray-300"
                    >
                      {product.stock >
                      0
                        ? t.addToCart
                        : t.unavailable}
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          Footer
      ===================================================== */}

      <footer className="bg-gray-900 px-4 py-8 text-center text-white">
        <h2 className="text-xl font-bold">
          {t.pharmacyName}
        </h2>

        <p className="mt-2 text-gray-300">
          {t.footerPriority}
        </p>

        <p className="mt-4 text-sm text-gray-400">
          {t.rights}
        </p>
      </footer>

      {/* =====================================================
          Cart
      ===================================================== */}

      {cartOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50">
          <div className="absolute inset-y-0 right-0 flex h-full w-[92vw] max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">
                {t.shoppingCart}
              </h2>

              <button
                onClick={() =>
                  setCartOpen(false)
                }
                className="text-2xl text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!cart.length ? (
                <div className="py-20 text-center">
                  <div className="text-6xl">
                    🛒
                  </div>

                  <h3 className="mt-5 font-bold text-gray-800">
                    {t.emptyCart}
                  </h3>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(
                      (item: CartItem) => (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-xl border p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-green-50">
                              {item.image_url ? (
                                <img
                                  src={
                                    item.image_url
                                  }
                                  alt={
                                    item.name_ar
                                  }
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-5xl">
                                  {
                                    item.icon ||
                                    "💊"
                                  }
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="break-words font-bold text-gray-800">
                                {
                                  isArabic
                                    ? item.name_ar
                                    : item.name_en ||
                                      item.name_ar
                                }
                              </h3>

                              {item.name_en && (
                                <p
                                  dir="ltr"
                                  className="mt-1 truncate text-xs text-gray-600"
                                >
                                  {
                                    isArabic
                                      ? item.name_en
                                      : item.name_ar
                                  }
                                </p>
                              )}

                              <p className="mt-1 text-sm font-medium text-gray-700">
                                {
                                  item.price
                                }{" "}
                                {isArabic
                                  ? "جنيه"
                                  : "EGP"}
                              </p>

                              <p className="mt-1 text-xs font-medium text-gray-700">
                                {t.availableNow}{" "}
                                {
                                  item.stock
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold text-gray-800">
                                {t.quantity}:{" "}
                                {
                                  item.quantity
                                }
                              </p>

                              <p className="mt-2 text-sm font-semibold text-gray-700">
                                {t.total}:{" "}
                                {
                                  item.price *
                                  item.quantity
                                }{" "}
                                {isArabic
                                  ? "جنيه"
                                  : "EGP"}
                              </p>
                            </div>

                            <div
                              dir="ltr"
                              className="flex items-center justify-center gap-3"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(
                                    item.id
                                  )
                                }
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-300 text-2xl font-black text-black shadow-sm hover:bg-gray-400"
                              >
                                −
                              </button>

                              <span className="flex h-11 min-w-[50px] items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-3 text-xl font-black text-black">
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(
                                    item.id
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                  item.stock
                                }
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-2xl font-black text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <p className="mt-3 text-sm font-semibold text-gray-700">
                            {t.total}:{" "}
                            {
                              item.price *
                              item.quantity
                            }{" "}
                            {isArabic
                              ? "جنيه"
                              : "EGP"}
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-6 rounded-xl bg-green-50 p-4">
                    <div className="flex items-center justify-between font-bold">
                      <span>
                        {t.cartTotal}
                      </span>

                      <span className="text-green-700">
                        {
                          cartTotal
                        }{" "}
                        {isArabic
                          ? "جنيه"
                          : "EGP"}
                      </span>
                    </div>

                    <button
                      onClick={
                        openCheckout
                      }
                      className="mt-5 w-full rounded-xl bg-green-600 py-3 font-bold text-white"
                    >
                      {t.checkout}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Checkout
      ===================================================== */}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[210] overflow-y-auto bg-black/60 p-3">
          <div className="mx-auto mt-6 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">
                {t.orderData}
              </h2>

              <button
                onClick={() =>
                  setCheckoutOpen(false)
                }
                className="text-2xl text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block font-bold text-gray-800">
                  {t.fullName}
                </label>

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 text-gray-900"
                  placeholder={
                    t.enterName
                  }
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-800">
                  {t.phone}
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  dir="ltr"
                  className="w-full rounded-xl border px-4 py-3 text-left text-gray-900"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-800">
                  {t.address}
                </label>

                <textarea
                  value={
                    address
                  }
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl border px-4 py-3 text-gray-900"
                  placeholder={
                    t.enterAddress
                  }
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-800">
                  {t.notes}
                </label>

                <textarea
                  value={
                    notes
                  }
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  rows={2}
                  className="w-full rounded-xl border px-4 py-3 text-gray-900"
                  placeholder={
                    t.extraNotes
                  }
                />
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <div className="flex items-center justify-between font-bold">
                  <span>
                    {t.orderTotal}
                  </span>

                  <span className="text-green-700">
                    {
                      cartTotal
                    }{" "}
                    {isArabic
                      ? "جنيه"
                      : "EGP"}
                  </span>
                </div>
              </div>

              <button
                onClick={
                  confirmOrder
                }
                disabled={ordering}
                className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white disabled:opacity-60"
              >
                {ordering
                  ? t.sendingOrder
                  : t.confirmOrder}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}