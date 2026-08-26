"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminNavigation() {
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      setCheckingAdmin(true);

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
            "ADMIN SESSION ERROR:",
            sessionError
          );

          setIsAdmin(false);
          return;
        }

        if (!session?.user) {
          setIsAdmin(false);
          return;
        }

        const userId = session.user.id;

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (profileError) {
          console.error(
            "ADMIN PROFILE ERROR:",
            profileError
          );

          setIsAdmin(false);
          return;
        }

        setIsAdmin(
          profile?.role === "admin"
        );
      } catch (error) {
        console.error(
          "CHECK ADMIN ERROR:",
          error
        );

        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setCheckingAdmin(false);
        }
      }
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  // صفحات الأدمن لها شريط خاص بها
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // أثناء التحقق لا نظهر أي شيء
  if (checkingAdmin) {
    return null;
  }

  // العميل العادي لا يرى شريط الأدمن
  if (!isAdmin) {
    return null;
  }

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-50 border-b bg-white shadow-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
        <Link
          href="/admin/dashboard"
          className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
        >
          📊 لوحة التحكم
        </Link>

        <Link
          href="/admin"
          className="rounded-xl border border-blue-600 bg-white px-5 py-3 font-bold text-blue-700 hover:bg-blue-50"
        >
          🛒 الطلبات
        </Link>

        <Link
          href="/admin/products"
          className="rounded-xl border border-purple-600 bg-white px-5 py-3 font-bold text-purple-700 hover:bg-purple-50"
        >
          📦 المنتجات الموجودة
        </Link>

        <Link
          href="/admin/products/add"
          className="rounded-xl border border-green-600 bg-white px-5 py-3 font-bold text-green-700 hover:bg-green-50"
        >
          ➕ إضافة منتج
        </Link>

        <Link
          href="/"
          className="rounded-xl border border-gray-400 bg-white px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
        >
          🏠 الصفحة الرئيسية
        </Link>
      </div>
    </nav>
  );
}