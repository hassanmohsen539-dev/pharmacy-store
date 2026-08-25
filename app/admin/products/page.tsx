"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: number;
  name_ar: string | null;
  name_en: string | null;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function checkAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("PROFILE ERROR:", error);
        setAllowed(false);
        setLoading(false);
        return;
      }

      if (!profile || profile.role !== "admin") {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);

      await loadProducts();

      setLoading(false);
    } catch (error) {
      console.error("CHECK ADMIN ERROR:", error);
      setAllowed(false);
      setLoading(false);
    }
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("PRODUCTS ERROR:", error);
      alert("حدث خطأ أثناء تحميل المنتجات.");
      return;
    }

    setProducts((data || []) as Product[]);
  }

  async function updateStock(id: number, newStock: number) {
    if (newStock < 0) {
      alert("الكمية لا يمكن أن تكون أقل من صفر.");
      return;
    }

    setSavingId(id);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          stock: newStock,
        })
        .eq("id", id);

      if (error) {
        console.error("UPDATE STOCK ERROR:", error);
        alert("حدث خطأ أثناء تعديل الكمية:\n" + error.message);
        return;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === id
            ? {
                ...product,
                stock: newStock,
              }
            : product
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteProduct(id: number) {
    const confirmed = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذا المنتج؟"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE PRODUCT ERROR:", error);
      alert("حدث خطأ أثناء حذف المنتج:\n" + error.message);
      return;
    }

    setProducts((current) =>
      current.filter((product) => product.id !== id)
    );

    alert("تم حذف المنتج بنجاح 🗑️");
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="text-xl font-bold text-green-700">
          جاري تحميل المنتجات...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-6"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">🚫</div>

          <h1 className="mt-5 text-2xl font-bold text-red-600">
            ممنوع الدخول
          </h1>

          <p className="mt-3 text-gray-600">
            ليس لديك صلاحية للوصول إلى المنتجات.
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

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              المنتجات الموجودة
            </h1>

            <p className="text-sm text-gray-500">
              صيدلية الشفاء
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/products/add"
              className="rounded-lg bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700"
            >
              ➕ إضافة منتج
            </a>

            <button
              onClick={loadProducts}
              className="rounded-lg bg-gray-700 px-5 py-2 font-bold text-white hover:bg-gray-800"
            >
              🔄 تحديث
            </button>

            <a
              href="/admin"
              className="rounded-lg border border-green-600 px-5 py-2 font-bold text-green-700 hover:bg-green-50"
            >
              لوحة الأدمن
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            قائمة المنتجات
          </h2>

          <p className="mt-2 text-gray-500">
            إجمالي المنتجات: {products.length}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">📦</div>

            <h3 className="mt-5 text-2xl font-bold text-gray-700">
              لا توجد منتجات
            </h3>

            <p className="mt-2 text-gray-500">
              لم تتم إضافة أي منتجات حتى الآن.
            </p>

            <a
              href="/admin/products/add"
              className="mt-6 inline-block rounded-xl bg-green-600 px-7 py-3 font-bold text-white hover:bg-green-700"
            >
              ➕ إضافة أول منتج
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                {/* Product Image + Header */}
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-green-50">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_ar || product.name_en || "منتج"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">💊</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-gray-800">
                      {product.name_ar ||
                        product.name_en ||
                        "منتج بدون اسم"}
                    </h3>

                    {product.name_en && product.name_ar && (
                      <p className="mt-1 truncate text-sm text-gray-400">
                        {product.name_en}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-gray-400">
                      رقم المنتج: {product.id}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-5 min-h-[48px] text-gray-500">
                  {product.description || "لا يوجد وصف"}
                </p>

                {/* Price */}
                <div className="mt-5 rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-sm text-gray-500">
                    السعر
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-700">
                    {product.price} جنيه
                  </p>
                </div>

                {/* Stock */}
                <div
                  className={`mt-4 rounded-xl p-4 ${
                    product.stock === 0
                      ? "bg-red-50"
                      : product.stock <= 5
                      ? "bg-yellow-50"
                      : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        الكمية المتاحة
                      </p>

                      <p className="mt-1 text-2xl font-bold text-gray-800">
                        {product.stock}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateStock(
                            product.id,
                            Math.max(0, product.stock - 1)
                          )
                        }
                        disabled={savingId === product.id}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-xl font-bold text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        −
                      </button>

                      <button
                        onClick={() =>
                          updateStock(
                            product.id,
                            product.stock + 1
                          )
                        }
                        disabled={savingId === product.id}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-xl font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Direct stock editing */}
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-bold text-gray-600">
                      تعديل الكمية مباشرة
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={product.stock}
                      disabled={savingId === product.id}
                      onChange={(e) => {
                        const value = Number(e.target.value);

                        setProducts((current) =>
                          current.map((item) =>
                            item.id === product.id
                              ? {
                                  ...item,
                                  stock:
                                    Number.isNaN(value) ||
                                    value < 0
                                      ? 0
                                      : value,
                                }
                              : item
                          )
                        );
                      }}
                      onBlur={() =>
                        updateStock(product.id, product.stock)
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-lg font-bold text-gray-900 outline-none focus:border-green-600"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      window.location.href = `/admin/products/edit/${product.id}`;
                    }}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    ✏️ تعديل
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}