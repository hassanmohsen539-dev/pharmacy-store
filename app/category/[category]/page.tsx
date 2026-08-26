"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

const CATEGORY_INFO: Record<
  string,
  {
    title: string;
    description: string;
    icon: string;
  }
> = {
  medicines: {
    title: "الأدوية",
    description:
      "أدوية ومستلزمات علاجية",
    icon: "💊",
  },

  "skin-care": {
    title: "العناية بالبشرة",
    description:
      "منتجات العناية بالبشرة",
    icon: "🧴",
  },

  kids: {
    title: "الأطفال",
    description:
      "منتجات الأطفال والأمهات",
    icon: "🍼",
  },

  "medical-devices": {
    title: "الأجهزة الطبية",
    description:
      "أجهزة ومستلزمات طبية",
    icon: "🩺",
  },
};

export default function CategoryPage() {
  const params = useParams();

  const categoryParam =
    Array.isArray(
      params.category
    )
      ? params.category[0]
      : params.category;

  const category =
    categoryParam || "";

  const categoryInfo =
    CATEGORY_INFO[category];

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [search, setSearch] =
    useState("");

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [
    checkoutOpen,
    setCheckoutOpen,
  ] =
    useState(false);

  const [
    customerName,
    setCustomerName,
  ] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [ordering, setOrdering] =
    useState(false);

  // =====================================================
  // تحميل منتجات القسم
  // =====================================================

  async function loadProducts() {
    setLoading(true);
    setError(null);

    try {
      const {
        data,
        error: productsError,
      } = await supabase
        .from("products")
        .select(
          "id, name_ar, name_en, description, price, stock, icon, image_url, category"
        )
        .eq(
          "category",
          category
        )
        .order("id", {
          ascending: true,
        });

      if (productsError) {
        throw productsError;
      }

      setProducts(
        (data || []) as Product[]
      );
    } catch (err) {
      console.error(
        "CATEGORY PRODUCTS ERROR:",
        err
      );

      setProducts([]);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل المنتجات."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!categoryInfo) {
      setLoading(false);
      return;
    }

    void loadProducts();
  }, [category]);

  // =====================================================
  // المنتجات بعد البحث
  // =====================================================

  const filteredProducts =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      if (!text) {
        return products;
      }

      return products.filter(
        (product: Product) =>
          product.name_ar
            .toLowerCase()
            .includes(text) ||
          (
            product.name_en ||
            ""
          )
            .toLowerCase()
            .includes(text) ||
          (
            product.description ||
            ""
          )
            .toLowerCase()
            .includes(text)
      );
    }, [
      products,
      search,
    ]);

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
      (
        currentCart: CartItem[]
      ) => {
        const existing =
          currentCart.find(
            (
              item: CartItem
            ) =>
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
            (
              item: CartItem
            ) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    price:
                      product.price,
                    stock:
                      product.stock,
                    name_ar:
                      product.name_ar,
                    name_en:
                      product.name_en,
                    description:
                      product.description,
                    image_url:
                      product.image_url,
                    icon:
                      product.icon,
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
      (
        currentCart: CartItem[]
      ) =>
        currentCart.map(
          (
            item: CartItem
          ) => {
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
      (
        currentCart: CartItem[]
      ) =>
        currentCart
          .map(
            (
              item: CartItem
            ) =>
              item.id === id
                ? {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  }
                : item
          )
          .filter(
            (
              item: CartItem
            ) =>
              item.quantity > 0
          )
    );
  }

  const cartCount =
    cart.reduce(
      (
        sum: number,
        item: CartItem
      ) =>
        sum +
        item.quantity,
      0
    );

  const cartTotal =
    cart.reduce(
      (
        sum: number,
        item: CartItem
      ) =>
        sum +
        Number(
          item.price
        ) *
          item.quantity,
      0
    );

  // =====================================================
  // فتح إتمام الطلب
  // =====================================================

  function openCheckout() {
    if (!cart.length) {
      alert(
        "السلة فارغة."
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
        "من فضلك املأ الاسم ورقم الهاتف والعنوان."
      );

      return;
    }

    if (!cart.length) {
      alert(
        "السلة فارغة."
      );

      return;
    }

    setOrdering(true);

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        alert(
          "يجب تسجيل الدخول أولاً لإتمام الطلب."
        );

        return;
      }

      // ---------------------------------------------------
      // نقرأ المنتجات من قاعدة البيانات مرة ثانية
      // للتأكد من المخزون الحقيقي.
      // ---------------------------------------------------

      const productIds =
        cart.map(
          (
            item: CartItem
          ) =>
            item.id
        );

      const {
        data: latestProducts,
        error:
          latestProductsError,
      } =
        await supabase
          .from("products")
          .select(
            "id, name_ar, name_en, description, price, stock, icon, image_url, category"
          )
          .in(
            "id",
            productIds
          );

      if (
        latestProductsError
      ) {
        alert(
          "حدث خطأ أثناء التأكد من المخزون:\n\n" +
            latestProductsError.message
        );

        return;
      }

      for (
        const cartItem of cart
      ) {
        const latest =
          latestProducts?.find(
            (
              item: Product
            ) =>
              item.id ===
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

      // ---------------------------------------------------
      // إنشاء الطلب في نفس جدول orders
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // تفاصيل الطلب في نفس جدول order_items
      // ---------------------------------------------------

      const orderItems =
        cart.map(
          (
            item: CartItem
          ) => {
            const latest =
              latestProducts?.find(
                (
                  product: Product
                ) =>
                  product.id ===
                  item.id
              );

            return {
              order_id:
                order.id,

              product_id:
                item.id,

              product_name:
                item.name_ar,

              price:
                latest?.price ??
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
            };
          }
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

      if (itemsError) {
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
    } catch (err) {
      console.error(
        "CATEGORY ORDER ERROR:",
        err
      );

      alert(
        "حدث خطأ غير متوقع أثناء إرسال الطلب."
      );
    } finally {
      setOrdering(false);
    }
  }

  // =====================================================
  // القسم غير معروف
  // =====================================================

  if (!categoryInfo) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
      >
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">
            ❌
          </div>

          <h1 className="mt-5 text-2xl font-bold text-red-600">
            القسم غير موجود
          </h1>

          <p className="mt-3 text-gray-500">
            القسم الذي طلبته غير موجود.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            🏠 العودة للرئيسية
          </Link>
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
      className="min-h-[100dvh] w-full overflow-x-hidden bg-gray-50"
    >
      {/* ===================================================
          Header
      =================================================== */}

      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              صيدلية الشفاء
            </h1>

            <p className="text-sm text-gray-500">
              {categoryInfo.icon}{" "}
              {categoryInfo.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl border border-gray-400 px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
            >
              🏠 الرئيسية
            </Link>

            <button
              onClick={() =>
                setCartOpen(true)
              }
              className="relative rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
            >
              🛒 السلة

              {cartCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {
                    cartCount
                  }
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================
          Hero
      =================================================== */}

      <section className="bg-green-700 px-4 py-10 text-center text-white sm:px-6 sm:py-14">
        <div className="text-6xl">
          {categoryInfo.icon}
        </div>

        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
          {categoryInfo.title}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-green-100">
          {categoryInfo.description}
        </p>

        <div className="mx-auto mt-7 flex w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="ابحث داخل هذا القسم..."
            className="min-w-0 flex-1 px-4 py-3 text-right text-gray-900 outline-none sm:px-5"
          />

          <button
            type="button"
            className="shrink-0 bg-green-600 px-5 py-3 font-bold text-white"
          >
            🔎 بحث
          </button>
        </div>
      </section>

      {/* ===================================================
          المنتجات
      =================================================== */}

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              منتجات{" "}
              {categoryInfo.title}
            </h2>

            <p className="mt-2 text-gray-500">
              المنتجات الموجودة في هذا القسم فقط
            </p>
          </div>

          <button
            onClick={
              loadProducts
            }
            className="rounded-xl border border-green-600 px-5 py-2 font-bold text-green-700 hover:bg-green-50"
          >
            🔄 تحديث المنتجات
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <div className="text-6xl">
              {categoryInfo.icon}
            </div>

            <p className="mt-5 text-lg font-bold text-green-700">
              جاري تحميل المنتجات...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-6xl">
              ⚠️
            </div>

            <h3 className="mt-4 text-2xl font-bold text-red-600">
              تعذر تحميل المنتجات
            </h3>

            <p className="mt-3 text-gray-500">
              {error}
            </p>

            <button
              onClick={
                loadProducts
              }
              className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
            >
              🔄 إعادة المحاولة
            </button>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <div className="text-6xl">
              📦
            </div>

            <h3 className="mt-5 text-2xl font-bold text-gray-700">
              لا توجد منتجات في هذا القسم
            </h3>

            <p className="mt-2 text-gray-500">
              سيتم عرض المنتجات هنا عند إضافتها إلى القسم.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {filteredProducts.map(
              (
                product: Product
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
                      <span className="text-6xl">
                        {product.icon ||
                          categoryInfo.icon}
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
                      className="mt-1 truncate text-xs text-gray-400 sm:text-sm"
                    >
                      {
                        product.name_en
                      }
                    </p>
                  )}

                  <p className="mt-2 min-h-[40px] text-xs text-gray-500 sm:min-h-[48px] sm:text-sm">
                    {
                      product.description ||
                      "لا يوجد وصف"
                    }
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-green-700 sm:text-xl">
                      {
                        product.price
                      }{" "}
                      جنيه
                    </span>

                    {product.stock >
                    0 ? (
                      <span className="text-xs font-bold text-gray-500">
                        متوفر:{" "}
                        {
                          product.stock
                        }
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600">
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
                    className="mt-4 w-full rounded-xl bg-green-600 px-3 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
      </section>

      {/* ===================================================
          Cart
      =================================================== */}

      {cartOpen && (
        <div className="fixed inset-0 z-[200] h-[100dvh] w-screen overflow-hidden bg-black/50">
          <div className="absolute inset-y-0 right-0 flex h-[100dvh] w-[92vw] max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:w-full">
            <div className="flex shrink-0 items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">
                🛒 السلة
              </h2>

              <button
                onClick={() =>
                  setCartOpen(
                    false
                  )
                }
                className="text-2xl text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
              {cart.length ===
              0 ? (
                <div className="flex min-h-full flex-col items-center justify-center text-center">
                  <div className="text-6xl">
                    🛒
                  </div>

                  <p className="mt-4 font-bold text-gray-700">
                    السلة فارغة
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(
                      (
                        item: CartItem
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-xl border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-green-50">
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
                                <span className="text-3xl">
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
                                  item.name_ar
                                }
                              </h3>

                              <p className="mt-1 text-sm text-gray-500">
                                {
                                  item.price
                                }{" "}
                                جنيه
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t pt-4">
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

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  decreaseQuantity(
                                    item.id
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 font-bold"
                              >
                                −
                              </button>

                              <span className="font-bold">
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
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 font-bold text-white disabled:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-6 rounded-xl bg-green-50 p-4">
                    <div className="flex justify-between font-bold">
                      <span>
                        الإجمالي
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
                      className="mt-4 w-full rounded-xl bg-green-600 py-3 font-bold text-white"
                    >
                      إتمام الطلب
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          Checkout
      =================================================== */}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[210] h-[100dvh] w-screen overflow-y-auto bg-black/60 p-3">
          <div className="mx-auto mt-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">
                📝 بيانات الطلب
              </h2>

              <button
                onClick={() =>
                  setCheckoutOpen(
                    false
                  )
                }
                className="text-2xl text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  الاسم بالكامل
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
                  className="w-full rounded-xl border p-3 text-gray-900"
                  placeholder="اكتب اسمك"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  رقم الموبايل
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border p-3 text-gray-900"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  العنوان
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl border p-3 text-gray-900"
                  placeholder="اكتب عنوان التوصيل"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-gray-700">
                  ملاحظات
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  rows={2}
                  className="w-full rounded-xl border p-3 text-gray-900"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <div className="flex justify-between font-bold">
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
                className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white disabled:opacity-60"
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