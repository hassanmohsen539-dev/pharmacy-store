"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] =
    useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>(
    []
  );

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  const [quantityChanges, setQuantityChanges] = useState<
    QuantityChange[]
  >([]);

  const [respondingChange, setRespondingChange] = useState<
    number | null
  >(null);

  // =====================================================
  // تحميل المنتجات
  // =====================================================

  async function loadProducts() {
    console.log("بدأ تحميل المنتجات من API...");

    setProductsLoading(true);
    setProductsError(null);

    try {
      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      console.log("API PRODUCTS RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "حدث خطأ أثناء تحميل المنتجات."
        );
      }

      setProducts((result || []) as Product[]);
    } catch (error) {
      console.error(
        "LOAD PRODUCTS ERROR:",
        error
      );

      setProducts([]);

      setProductsError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل المنتجات."
      );
    } finally {
      setProductsLoading(false);
    }
  }

  // =====================================================
  // تحميل الإشعارات
  // =====================================================

  async function loadNotifications(
    currentUserId: string
  ) {
    setNotificationsLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase
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
        );

      if (error) {
        console.error(
          "LOAD NOTIFICATIONS ERROR:",
          error
        );
        return;
      }

      setNotifications(
        (data || []) as Notification[]
      );
    } catch (error) {
      console.error(
        "NOTIFICATIONS ERROR:",
        error
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  // =====================================================
  // تحميل تغييرات الكمية
  // =====================================================

  async function loadQuantityChanges(
    currentUserId: string
  ) {
    try {
      const {
        data: orders,
        error: ordersError,
      } = await supabase
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

      const orderIds = orders.map(
        (order) => order.id
      );

      const {
        data,
        error,
      } = await supabase
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
            ascending: false,
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
  // تحميل المستخدم مرة واحدة
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

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

        console.log(
          "INITIAL SESSION:",
          session
        );

        if (!session?.user) {
          setUserId(null);
          setUserEmail(null);
          setUserName(null);
          setNotifications([]);
          setQuantityChanges([]);

          return;
        }

        const user = session.user;

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
          loadNotifications(user.id),
          loadQuantityChanges(user.id),
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

    const channel = supabase
      .channel(
        `customer-live-${userId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter:
            `user_id=eq.${userId}`,
        },
        async (payload) => {
          const notification =
            payload.new as Notification;

          setNotifications(
            (current) => [
              notification,
              ...current,
            ]
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
          event: "*",
          schema: "public",
          table:
            "order_quantity_changes",
        },
        async () => {
          await loadQuantityChanges(
            userId
          );
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
  // تسجيل الخروج
  // =====================================================

  async function handleLogout() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "SIGN OUT ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء تسجيل الخروج"
      );

      return;
    }

    setUserId(null);
    setUserEmail(null);
    setUserName(null);
    setNotifications([]);
    setQuantityChanges([]);

    alert(
      "تم تسجيل الخروج بنجاح 👋"
    );
  }

  // =====================================================
  // قراءة إشعار
  // =====================================================

  async function markNotificationAsRead(
    notificationId: number
  ) {
    const {
      error,
    } =
      await supabase
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
        "MARK NOTIFICATION ERROR:",
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
  // قراءة كل الإشعارات
  // =====================================================

  async function markAllNotificationsAsRead() {
    if (!userId) {
      return;
    }

    const unreadIds =
      notifications
        .filter(
          (notification) =>
            !notification.is_read
        )
        .map(
          (notification) =>
            notification.id
        );

    if (!unreadIds.length) {
      return;
    }

    const {
      error,
    } =
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
        "حدث خطأ أثناء تحديث الإشعارات."
      );

      return;
    }

    setNotifications(
      (current) =>
        current.map(
          (notification) => ({
            ...notification,
            is_read: true,
          })
        )
    );
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
      const {
        data: admins,
        error: adminsError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq(
          "role",
          "admin"
        );

      if (adminsError) {
        console.error(
          "LOAD ADMINS ERROR:",
          adminsError
        );

        return;
      }

      if (
        !admins ||
        admins.length === 0
      ) {
        console.error(
          "NO ADMINS FOUND"
        );

        return;
      }

      const rows =
        admins.map(
          (admin) => ({
            user_id:
              admin.id,
            order_id:
              orderId,
            order_item_id:
              orderItemId,
            type:
              "quantity_response",
            title,
            message,
            is_read:
              false,
          })
        );

      const {
        error:
          notificationError,
      } =
        await supabase
          .from(
            "notifications"
          )
          .insert(rows);

      if (
        notificationError
      ) {
        console.error(
          "INSERT ADMIN NOTIFICATION ERROR:",
          notificationError
        );

        return;
      }

      console.log(
        "ADMIN NOTIFICATION SENT SUCCESSFULLY"
      );
    } catch (error) {
      console.error(
        "NOTIFY ADMINS ERROR:",
        error
      );
    }
  }

  // =====================================================
  // الموافقة / رفض تعديل الكمية
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
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          "يجب تسجيل الدخول أولاً."
        );

        return;
      }

      const {
        data: order,
        error: orderError,
      } =
        await supabase
          .from("orders")
          .select(
            "id,user_id"
          )
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
          "لا يمكن تنفيذ هذا التعديل."
        );

        return;
      }

      const {
        data: currentChange,
        error: changeError,
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
          "حدث خطأ أثناء التحقق من التعديل:\n" +
            changeError.message
        );

        return;
      }

      if (!currentChange) {
        alert(
          "هذا التعديل تم التعامل معه بالفعل."
        );

        await loadQuantityChanges(
          user.id
        );

        return;
      }

      const {
        data: item,
        error: itemError,
      } =
        await supabase
          .from(
            "order_items"
          )
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

      if (
        itemError ||
        !item
      ) {
        alert(
          "تعذر العثور على المنتج داخل الطلب."
        );

        return;
      }

      const newStatus =
        approved
          ? "approved"
          : "rejected";

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
              new Date().toISOString(),
          })
          .eq(
            "id",
            change.id
          )
          .eq(
            "status",
            "pending"
          );

      if (
        updateChangeError
      ) {
        alert(
          "فشل حفظ ردك:\n" +
            updateChangeError.message
        );

        return;
      }

      const finalQuantity =
        approved
          ? change.new_quantity
          : change.old_quantity;

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
              finalQuantity,
            approved_quantity:
              finalQuantity,
            customer_approval:
              newStatus,
            approval_message:
              approved
                ? `وافق العميل على تعديل الكمية إلى ${change.new_quantity}.`
                : "رفض العميل تعديل الكمية.",
          })
          .eq(
            "id",
            change.order_item_id
          )
          .eq(
            "order_id",
            change.order_id
          );

      if (
        updateItemError
      ) {
        alert(
          "تم حفظ ردك ولكن حدث خطأ في تحديث المنتج:\n" +
            updateItemError.message
        );

        return;
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
            change.order_id
          );

      if (
        !allItemsError
      ) {
        const newTotal =
          (
            allItems ||
            []
          ).reduce(
            (
              sum,
              orderItem
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
      }

      if (approved) {
        await notifyAdmins(
          change.order_id,
          change.order_item_id,
          "العميل وافق على تعديل الكمية ✅",
          `العميل وافق على تعديل الكمية من ${change.old_quantity} إلى ${change.new_quantity} في الطلب رقم ${change.order_id}.`
        );

        alert(
          `تمت الموافقة بنجاح ✅\n\nالكمية المعتمدة: ${change.new_quantity}`
        );
      } else {
        await notifyAdmins(
          change.order_id,
          change.order_item_id,
          "العميل رفض تعديل الكمية ❌",
          `العميل رفض تعديل الكمية من ${change.old_quantity} إلى ${change.new_quantity} في الطلب رقم ${change.order_id}.`
        );

        alert(
          "تم رفض تعديل الكمية ❌\n\nتم الاحتفاظ بالكمية الأصلية."
        );
      }

      await Promise.all([
        loadQuantityChanges(
          user.id
        ),
        loadNotifications(
          user.id
        ),
      ]);
    } catch (error) {
      console.error(
        "RESPOND QUANTITY CHANGE ERROR:",
        error
      );

      alert(
        "حدث خطأ أثناء إرسال ردك."
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
        "هذا المنتج غير متوفر حاليًا."
      );

      return;
    }

    setCart(
      (currentCart) => {
        const existing =
          currentCart.find(
            (item) =>
              item.id ===
              product.id
          );

        if (existing) {
          if (
            existing.quantity >=
            product.stock
          ) {
            alert(
              `الكمية المتاحة من ${product.name_ar} هي ${product.stock} فقط.`
            );

            return currentCart;
          }

          return currentCart.map(
            (item) =>
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
      (currentCart) =>
        currentCart.map(
          (item) => {
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
                `لا يمكن زيادة الكمية.\nالمتاح من ${item.name_ar} هو ${item.stock} فقط.`
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
      (currentCart) =>
        currentCart
          .map(
            (item) =>
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
            (item) =>
              item.quantity >
              0
          )
    );
  }

  const cartCount =
    cart.reduce(
      (total, item) =>
        total +
        item.quantity,
      0
    );

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        item.price *
          item.quantity,
      0
    );

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  const pendingQuantityChanges =
    quantityChanges.filter(
      (change) =>
        change.status ===
        "pending"
    );

  // =====================================================
  // البحث
  // =====================================================

  const filteredProducts =
    products.filter(
      (product) => {
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

  // =====================================================
  // فتح إتمام الطلب
  // =====================================================

  function openCheckout() {
    if (!userId) {
      alert(
        "يجب تسجيل الدخول أولاً لإتمام الطلب."
      );

      return;
    }

    if (!cart.length) {
      alert(
        "السلة فارغة، أضف منتج أولاً"
      );

      return;
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  }

  // =====================================================
  // تأكيد الطلب
  // =====================================================

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
        "من فضلك املأ الاسم ورقم الهاتف والعنوان"
      );

      return;
    }

    if (!cart.length) {
      alert(
        "السلة فارغة"
      );

      return;
    }

    setOrdering(true);

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          "يجب تسجيل الدخول أولاً لإتمام الطلب"
        );

        setCheckoutOpen(false);

        return;
      }

      const productIds =
        cart.map(
          (item) => item.id
        );

      const {
        data: latestProducts,
        error: stockError,
      } =
        await supabase
          .from("products")
          .select(
            "id, name_ar, name_en, price, stock, description, icon, image_url, category"
          )
          .in(
            "id",
            productIds
          );

      if (
        stockError
      ) {
        alert(
          "حدث خطأ أثناء التأكد من المخزون."
        );

        return;
      }

      for (
        const cartItem of
          cart
      ) {
        const latest =
          latestProducts?.find(
            (product) =>
              product.id ===
              cartItem.id
          );

        if (!latest) {
          alert(
            `المنتج "${cartItem.name_ar}" لم يعد موجودًا.`
          );

          return;
        }

        if (
          latest.stock <
          cartItem.quantity
        ) {
          alert(
            `المنتج "${latest.name_ar}" متوفر منه ${latest.stock} فقط.\n\nأنت طلبت ${cartItem.quantity}.`
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

      if (
        orderError
      ) {
        alert(
          "حدث خطأ أثناء إنشاء الطلب:\n\n" +
            orderError.message
        );

        return;
      }

      if (!order) {
        alert(
          "تم إنشاء الطلب ولكن لم يتم الحصول على رقم الطلب."
        );

        return;
      }

      const orderItems =
        cart.map(
          (item) => ({
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

      const {
        error:
          itemsError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .insert(
            orderItems
          );

      if (
        itemsError
      ) {
        alert(
          "حدث خطأ في حفظ تفاصيل المنتجات:\n\n" +
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
        "تم استلام طلبك بنجاح يا " +
          customerName.trim() +
          " 🎉\n\n" +
          "رقم الطلب: " +
          order.id +
          "\n" +
          "الإجمالي: " +
          cartTotal +
          " جنيه"
      );

      await loadProducts();
    } catch (error) {
      console.error(
        "CONFIRM ORDER ERROR:",
        error
      );

      alert(
        "حدث خطأ غير متوقع."
      );
    } finally {
      setOrdering(false);
    }
  }

  // =====================================================
  // شاشة تحميل المنتجات
  // =====================================================

  if (productsLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden bg-gray-50 px-4"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            💊
          </div>

          <h1 className="mt-4 text-2xl font-bold text-green-700">
            صيدلية الشفاء
          </h1>

          <p className="mt-4 text-lg font-bold text-gray-700">
            جاري تحميل المنتجات...
          </p>

          <p className="mt-2 text-sm text-gray-400">
            برجاء الانتظار
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // خطأ تحميل المنتجات
  // =====================================================

  if (productsError) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden bg-gray-50 px-4"
      >
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-lg sm:p-8">
          <div className="text-6xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-bold text-red-600">
            تعذر تحميل المنتجات
          </h1>

          <p className="mt-3 text-gray-600">
            حصلت مشكلة أثناء الاتصال بقاعدة البيانات.
          </p>

          <div
            dir="ltr"
            className="mt-5 max-w-full overflow-x-auto rounded-xl bg-red-50 p-4 text-left text-sm text-red-700"
          >
            {productsError}
          </div>

          <button
            onClick={
              loadProducts
            }
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] w-full overflow-x-hidden bg-gray-50"
    >
      {/* ================= HEADER ================= */}

      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="text-center sm:text-right">
            <h1 className="text-2xl font-bold text-green-700">
              صيدلية الشفاء
            </h1>

            <p className="text-sm text-gray-500">
              صحتك أولويتنا
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
            {loadingUser ? (
              <div className="rounded-lg border px-4 py-2 text-sm text-gray-400">
                جاري التحميل...
              </div>
            ) : userEmail ? (
              <>
                <a
                  href="/orders"
                  className="rounded-lg border border-green-600 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 sm:px-4"
                >
                  📦 طلباتي
                </a>

                <button
                  onClick={() =>
                    setNotificationsOpen(
                      true
                    )
                  }
                  className="relative rounded-lg border border-blue-500 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 sm:px-4"
                >
                  🔔 الإشعارات

                  {unreadNotifications >
                    0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {
                        unreadNotifications
                      }
                    </span>
                  )}
                </button>

                <div className="hidden rounded-lg bg-green-50 px-4 py-2 text-right sm:block">
                  <p className="text-xs text-gray-500">
                    أهلاً بك
                  </p>

                  <p className="max-w-[180px] truncate font-bold text-green-700">
                    {userName ||
                      userEmail}
                  </p>
                </div>

                <button
                  onClick={
                    handleLogout
                  }
                  className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 sm:px-4"
                >
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
              >
                👤 تسجيل الدخول
              </a>
            )}

            <button
              onClick={() =>
                setCartOpen(true)
              }
              className="relative rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:px-5"
            >
              🛒 السلة

              {cartCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
                  {
                    cartCount
                  }
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}

      <section className="w-full overflow-hidden bg-green-700 px-4 py-10 text-center text-white sm:px-6 sm:py-16">
        <h2 className="text-3xl font-bold sm:text-4xl">
          أهلاً بك في صيدلية الشفاء 💚
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base text-green-100 sm:text-lg">
          اطلب أدويتك ومنتجاتك الصحية بسهولة وأمان
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(
              e
            ) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="ابحث عن دواء أو منتج..."
            className="min-w-0 flex-1 px-4 py-3 text-right text-sm text-gray-900 placeholder-gray-400 outline-none sm:px-5 sm:py-4 sm:text-base"
          />

          <button className="shrink-0 bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 sm:px-7 sm:py-4 sm:text-base">
            بحث 🔎
          </button>
        </div>
      </section>

      {/* ================= NOTIFICATIONS ================= */}

      {notificationsOpen && (
        <div className="fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-black/60 p-3 sm:p-4">
          <div className="mx-auto mt-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:mt-10">
            <div className="flex shrink-0 items-center justify-between border-b bg-white p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                  🔔 الإشعارات
                </h2>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  تحديثات طلباتك وتعديلات الكميات
                </p>
              </div>

              <button
                onClick={() =>
                  setNotificationsOpen(
                    false
                  )
                }
                className="shrink-0 text-2xl text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
              {notificationsLoading ? (
                <div className="py-10 text-center font-bold text-green-700">
                  جاري تحميل الإشعارات...
                </div>
              ) : notifications.length ===
                0 ? (
                <div className="rounded-xl bg-gray-50 p-8 text-center sm:p-10">
                  <div className="text-5xl">
                    🔕
                  </div>

                  <p className="mt-4 font-bold text-gray-700">
                    لا توجد إشعارات
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map(
                    (
                      notification
                    ) => {
                      const relatedChange =
                        notification.type ===
                          "quantity_change" &&
                        notification.order_item_id
                          ? quantityChanges.find(
                              (
                                item
                              ) =>
                                item.order_item_id ===
                                  notification.order_item_id &&
                                item.order_id ===
                                  notification.order_id
                            )
                          : null;

                      const isQuantityNotification =
                        notification.type ===
                        "quantity_change";

                      const isOrderStatusNotification =
                        notification.type ===
                        "order_status";

                      return (
                        <div
                          key={
                            notification.id
                          }
                          onClick={() =>
                            markNotificationAsRead(
                              notification.id
                            )
                          }
                          className={`rounded-xl border-2 p-3 sm:p-4 ${
                            notification.is_read
                              ? "border-gray-200 bg-white"
                              : "border-blue-300 bg-blue-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 text-2xl">
                              {isQuantityNotification
                                ? "📦"
                                : isOrderStatusNotification
                                ? "🚚"
                                : "🔔"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="break-words font-bold text-gray-800">
                                  {
                                    notification.title
                                  }
                                </h3>

                                {!notification.is_read && (
                                  <span className="shrink-0 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                    جديد
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 break-words text-sm text-gray-600 sm:text-base">
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

                              {isQuantityNotification &&
                                relatedChange &&
                                relatedChange.status ===
                                  "pending" && (
                                  <div
                                    className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 sm:p-4"
                                    onClick={(
                                      e
                                    ) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <p className="font-bold text-orange-700">
                                      ⚠️ مطلوب موافقتك
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                                      <div className="rounded-lg bg-white p-3 text-center">
                                        <p className="text-xs text-gray-500">
                                          الكمية الأصلية
                                        </p>

                                        <p className="mt-1 text-xl font-black text-blue-700 sm:text-2xl">
                                          {
                                            relatedChange.old_quantity
                                          }
                                        </p>
                                      </div>

                                      <div className="rounded-lg bg-white p-3 text-center">
                                        <p className="text-xs text-gray-500">
                                          الكمية المقترحة
                                        </p>

                                        <p className="mt-1 text-xl font-black text-orange-600 sm:text-2xl">
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
                                        className="w-full flex-1 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {respondingChange ===
                                        relatedChange.id
                                          ? "جاري الحفظ..."
                                          : "✅ موافق"}
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
                                        className="w-full flex-1 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {respondingChange ===
                                        relatedChange.id
                                          ? "جاري الحفظ..."
                                          : "❌ رفض"}
                                      </button>
                                    </div>
                                  </div>
                                )}

                              {isQuantityNotification &&
                                relatedChange &&
                                relatedChange.status ===
                                  "approved" && (
                                  <div className="mt-4 rounded-xl border-2 border-green-300 bg-green-50 p-3 text-center text-sm font-bold text-green-700">
                                    ✅ تمت الموافقة على تعديل الكمية
                                  </div>
                                )}

                              {isQuantityNotification &&
                                relatedChange &&
                                relatedChange.status ===
                                  "rejected" && (
                                  <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center text-sm font-bold text-red-700">
                                    ❌ تم رفض تعديل الكمية
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

              {notifications.length >
                0 && (
                <button
                  onClick={
                    markAllNotificationsAsRead
                  }
                  className="mt-5 w-full rounded-xl border border-gray-300 py-3 font-bold text-gray-700 hover:bg-gray-50"
                >
                  تعليم كل الإشعارات كمقروءة
                </button>
              )}

              {pendingQuantityChanges.length >
                0 && (
                <div className="mt-4 rounded-xl bg-orange-50 p-4 text-center text-sm font-bold text-orange-700 sm:text-base">
                  يوجد{" "}
                  {
                    pendingQuantityChanges.length
                  }{" "}
                  تعديل كمية في انتظار موافقتك.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CATEGORIES ================= */}

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
          أقسام الصيدلية
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">

          <Link
            href="/category/medicines"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-7"
          >
            <div className="text-4xl sm:text-5xl">
              💊
            </div>

            <h3 className="mt-3 text-lg font-bold text-gray-800 sm:mt-4 sm:text-xl">
              الأدوية
            </h3>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              أدوية ومستلزمات علاجية
            </p>
          </Link>

          <Link
            href="/category/skin-care"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-7"
          >
            <div className="text-4xl sm:text-5xl">
              🧴
            </div>

            <h3 className="mt-3 text-lg font-bold text-gray-800 sm:mt-4 sm:text-xl">
              العناية بالبشرة
            </h3>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              منتجات العناية بالبشرة
            </p>
          </Link>

          <Link
            href="/category/kids"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-7"
          >
            <div className="text-4xl sm:text-5xl">
              🍼
            </div>

            <h3 className="mt-3 text-lg font-bold text-gray-800 sm:mt-4 sm:text-xl">
              الأطفال
            </h3>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              منتجات الأطفال والأمهات
            </p>
          </Link>

          <Link
            href="/category/medical-devices"
            className="rounded-2xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-7"
          >
            <div className="text-4xl sm:text-5xl">
              🩺
            </div>

            <h3 className="mt-3 text-lg font-bold text-gray-800 sm:mt-4 sm:text-xl">
              الأجهزة الطبية
            </h3>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              أجهزة ومستلزمات طبية
            </p>
          </Link>

        </div>
      </section>

      {/* ================= PRODUCTS ================= */}

      <section className="w-full bg-white px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                منتجات الصيدلية
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                المنتجات المتاحة حاليًا
              </p>
            </div>

            <button
              onClick={
                loadProducts
              }
              className="w-full rounded-xl border border-green-600 px-5 py-2 font-bold text-green-700 hover:bg-green-50 sm:w-auto"
            >
              🔄 تحديث المنتجات
            </button>
          </div>

          {filteredProducts.length ===
          0 ? (
            <div className="rounded-2xl bg-gray-50 py-16 text-center">
              <div className="text-6xl">
                📦
              </div>

              <h3 className="mt-5 text-2xl font-bold text-gray-700">
                لا توجد منتجات
              </h3>

              <p className="mt-2 text-gray-500">
                لم يتم إضافة منتجات حتى الآن.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {filteredProducts.map(
                (
                  product
                ) => (
                  <div
                    key={
                      product.id
                    }
                    className="min-w-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5"
                  >
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-green-50 sm:h-48">
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
                        <span className="text-6xl sm:text-7xl">
                          {
                            product.icon ||
                            "💊"
                          }
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 break-words text-base font-bold text-gray-800 sm:mt-4 sm:text-lg">
                      {
                        product.name_ar
                      }
                    </h3>

                    {product.name_en && (
                      <p
                        dir="ltr"
                        className="mt-1 truncate text-xs font-medium text-gray-400 sm:text-sm"
                      >
                        {
                          product.name_en
                        }
                      </p>
                    )}

                    <p className="mt-2 min-h-[40px] text-xs text-gray-500 sm:min-h-[48px] sm:text-sm">
                      {product.description ||
                        "لا يوجد وصف"}
                    </p>

                    <div className="mt-3 flex flex-col gap-1 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                      <span className="text-base font-bold text-green-700 sm:text-xl">
                        {
                          product.price
                        }{" "}
                        جنيه
                      </span>

                      {product.stock >
                      0 ? (
                        <span className="text-xs font-bold text-gray-500 sm:text-sm">
                          متوفر:{" "}
                          {
                            product.stock
                          }
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-600 sm:text-sm">
                          غير متوفر
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        addToCart(
                          product
                        )
                      }
                      disabled={
                        product.stock <=
                        0
                      }
                      className="mt-3 w-full rounded-xl bg-green-600 px-3 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:mt-4 sm:text-base"
                    >
                      {product.stock >
                      0
                        ? "أضف للسلة 🛒"
                        : "غير متوفر"}
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="w-full bg-gray-900 px-4 py-8 text-center text-white">
        <h2 className="text-xl font-bold">
          صيدلية الشفاء
        </h2>

        <p className="mt-2 text-gray-400">
          صحتك أولويتنا 💚
        </p>

        <p className="mt-4 text-sm text-gray-500">
          جميع الحقوق محفوظة © 2026
        </p>
      </footer>

      {/* ================= CART ================= */}

      {cartOpen && (
        <div className="fixed inset-0 z-[200] h-[100dvh] w-screen overflow-hidden bg-black/50">
          <div className="absolute inset-y-0 right-0 flex h-[100dvh] w-[92vw] max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:w-full">
            <div className="flex shrink-0 items-center justify-between border-b p-4 sm:p-5">
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                🛒 سلة المشتريات
              </h2>

              <button
                onClick={() =>
                  setCartOpen(
                    false
                  )
                }
                className="shrink-0 text-2xl text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {cart.length ===
              0 ? (
                <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
                  <div className="text-6xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-gray-700">
                    السلة فارغة
                  </h3>

                  <p className="mt-2 text-gray-500">
                    أضف بعض المنتجات إلى السلة
                  </p>
                </div>
              ) : (
                <div className="p-4 sm:p-5">
                  <div className="space-y-4">
                    {cart.map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-xl border p-3 sm:p-4"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-green-50 sm:h-16 sm:w-16">
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
                                <span className="text-3xl sm:text-4xl">
                                  {
                                    item.icon ||
                                    "💊"
                                  }
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-sm font-bold text-gray-800 sm:text-base">
                                {
                                  item.name_ar
                                }
                              </h3>

                              {item.name_en && (
                                <p
                                  dir="ltr"
                                  className="mt-1 truncate text-xs text-gray-400"
                                >
                                  {
                                    item.name_en
                                  }
                                </p>
                              )}

                              <p className="mt-1 text-sm text-gray-500">
                                {
                                  item.price
                                }{" "}
                                جنيه
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                المتاح:{" "}
                                {
                                  item.stock
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-bold text-gray-700">
                                الكمية:{" "}
                                {
                                  item.quantity
                                }
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                الإجمالي:{" "}
                                {
                                  item.price *
                                  item.quantity
                                }{" "}
                                جنيه
                              </p>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() =>
                                  decreaseQuantity(
                                    item.id
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-lg font-bold hover:bg-gray-300"
                              >
                                −
                              </button>

                              <span className="min-w-[30px] text-center text-lg font-bold text-gray-900">
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                onClick={() =>
                                  increaseQuantity(
                                    item.id
                                  )
                                }
                                disabled={
                                  item.quantity >=
                                  item.stock
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-lg font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-6 rounded-xl bg-green-50 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 text-lg font-bold sm:text-xl">
                      <span>
                        إجمالي السلة
                      </span>

                      <span className="text-green-700">
                        {
                          cartTotal
                        }{" "}
                        جنيه
                      </span>
                    </div>

                    <button
                      onClick={
                        openCheckout
                      }
                      className="mt-5 w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700"
                    >
                      إتمام الطلب
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= CHECKOUT ================= */}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[210] h-[100dvh] w-screen overflow-y-auto overflow-x-hidden bg-black/60 p-3 sm:p-4">
          <div className="mx-auto mt-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl sm:mt-10">
            <div className="flex items-center justify-between border-b p-4 sm:p-5">
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                📝 بيانات الطلب
              </h2>

              <button
                onClick={() =>
                  setCheckoutOpen(
                    false
                  )
                }
                className="shrink-0 text-2xl text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  الاسم بالكامل
                </label>

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(
                    e
                  ) =>
                    setCustomerName(
                      e.target
                        .value
                    )
                  }
                  placeholder="اكتب اسمك"
                  autoComplete="name"
                  className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  رقم الموبايل
                </label>

                <input
                  type="tel"
                  value={
                    phone
                  }
                  onChange={(
                    e
                  ) =>
                    setPhone(
                      e.target
                        .value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  autoComplete="tel"
                  className="w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  العنوان
                </label>

                <textarea
                  value={
                    address
                  }
                  onChange={(
                    e
                  ) =>
                    setAddress(
                      e.target
                        .value
                    )
                  }
                  placeholder="اكتب عنوان التوصيل بالتفصيل"
                  rows={3}
                  className="w-full min-w-0 resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  ملاحظات
                </label>

                <textarea
                  value={
                    notes
                  }
                  onChange={(
                    e
                  ) =>
                    setNotes(
                      e.target
                        .value
                    )
                  }
                  placeholder="أي ملاحظات إضافية..."
                  rows={2}
                  className="w-full min-w-0 resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <div className="flex items-center justify-between gap-3 text-lg font-bold">
                  <span>
                    إجمالي الطلب
                  </span>

                  <span className="text-green-700">
                    {
                      cartTotal
                    }{" "}
                    جنيه
                  </span>
                </div>
              </div>

              <button
                onClick={
                  confirmOrder
                }
                disabled={
                  ordering
                }
                className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ordering
                  ? "جاري إرسال الطلب..."
                  : "تأكيد الطلب ✅"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}