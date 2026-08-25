"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const {
          data: profile,
          error,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (
          error ||
          !profile ||
          profile.role !== "admin"
        ) {
          alert("ليس لديك صلاحية دخول لوحة الأدمن.");
          window.location.href = "/";
          return;
        }

        setAllowed(true);
      } catch (error) {
        console.error(
          "ADMIN DASHBOARD ERROR:",
          error
        );

        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, []);

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert("حدث خطأ أثناء تسجيل الخروج.");
      return;
    }

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50"
      >
        <div className="text-xl font-bold text-green-700">
          جاري تحميل لوحة التحكم...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      {/* ================= HEADER ================= */}

      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-700">
              لوحة تحكم الأدمن
            </h1>

            <p className="mt-1 text-gray-500">
              صيدلية الشفاء
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500 px-5 py-3 font-bold text-red-600 hover:bg-red-50"
          >
            تسجيل الخروج 🚪
          </button>
        </div>
      </header>

      {/* ================= CONTENT ================= */}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            اختر القسم
          </h2>

          <p className="mt-3 text-gray-500">
            اختر الصفحة التي تريد الدخول إليها
          </p>
        </div>

        {/* ================= CARDS ================= */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

          {/* إدارة المنتجات */}

          <a
            href="/admin/products"
            className="group rounded-3xl border-2 border-green-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-green-500 hover:shadow-xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-green-100 text-6xl transition group-hover:scale-110">
              📦
            </div>

            <h3 className="mt-6 text-2xl font-bold text-gray-800">
              إدارة المنتجات
            </h3>

            <p className="mt-3 text-gray-500">
              عرض المنتجات الموجودة وتعديل الأسعار والكميات والمخزون
            </p>

            <div className="mt-6 rounded-xl bg-green-600 py-3 font-bold text-white transition group-hover:bg-green-700">
              دخول المنتجات →
            </div>
          </a>

          {/* إضافة منتج */}

          <a
            href="/admin/products/add"
            className="group rounded-3xl border-2 border-emerald-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-6xl transition group-hover:scale-110">
              ➕
            </div>

            <h3 className="mt-6 text-2xl font-bold text-gray-800">
              إضافة منتج
            </h3>

            <p className="mt-3 text-gray-500">
              إضافة منتج جديد إلى منتجات صيدلية الشفاء
            </p>

            <div className="mt-6 rounded-xl bg-emerald-600 py-3 font-bold text-white transition group-hover:bg-emerald-700">
              إضافة منتج →
            </div>
          </a>

          {/* إدارة الطلبات */}

          <a
            href="/admin"
            className="group rounded-3xl border-2 border-blue-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 text-6xl transition group-hover:scale-110">
              🛒
            </div>

            <h3 className="mt-6 text-2xl font-bold text-gray-800">
              إدارة الطلبات
            </h3>

            <p className="mt-3 text-gray-500">
              متابعة الطلبات وتغيير حالتها وإدارة الكميات
            </p>

            <div className="mt-6 rounded-xl bg-blue-600 py-3 font-bold text-white transition group-hover:bg-blue-700">
              دخول الطلبات →
            </div>
          </a>

          {/* الصفحة الرئيسية */}

          <a
            href="/"
            className="group rounded-3xl border-2 border-purple-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-purple-500 hover:shadow-xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-purple-100 text-6xl transition group-hover:scale-110">
              🏠
            </div>

            <h3 className="mt-6 text-2xl font-bold text-gray-800">
              الصفحة الرئيسية
            </h3>

            <p className="mt-3 text-gray-500">
              فتح موقع الصيدلية كما يراه العملاء
            </p>

            <div className="mt-6 rounded-xl bg-purple-600 py-3 font-bold text-white transition group-hover:bg-purple-700">
              فتح الموقع →
            </div>
          </a>

        </div>

        {/* ================= INFO ================= */}

        <div className="mt-10 rounded-2xl border border-green-100 bg-green-50 p-6 text-center">
          <p className="font-bold text-green-800">
            👨‍💼 أنت الآن داخل لوحة تحكم الأدمن
          </p>

          <p className="mt-2 text-sm text-green-700">
            يمكنك الانتقال بين إضافة المنتجات وإدارة المنتجات
            والطلبات والصفحة الرئيسية من هنا.
          </p>
        </div>
      </section>
    </main>
  );
}