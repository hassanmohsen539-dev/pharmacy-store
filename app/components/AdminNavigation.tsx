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

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
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

  // أثناء الفحص لا نظهر الشريط
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
      className="sticky top-0 z-50 w-full border-b bg-white shadow-sm"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/admin/dashboard"
          className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 sm:px-5 sm:text-base"
        >
          📊 لوحة التحكم
        </Link>

        <Link
          href="/admin"
          className="rounded-xl border border-blue-600 bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 sm:px-5 sm:text-base"
        >
          🛒 الطلبات
        </Link>

        <Link
          href="/admin/products"
          className="rounded-xl border border-purple-600 bg-white px-4 py-3 text-sm font-bold text-purple-700 hover:bg-purple-50 sm:px-5 sm:text-base"
        >
          📦 المنتجات
        </Link>

        <Link
          href="/admin/products/add"
          className="rounded-xl border border-green-600 bg-white px-4 py-3 text-sm font-bold text-green-700 hover:bg-green-50 sm:px-5 sm:text-base"
        >
          ➕ إضافة منتج
        </Link>

        <Link
          href="/"
          className="rounded-xl border border-gray-400 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 sm:px-5 sm:text-base"
        >
          🏠 الرئيسية
        </Link>
      </div>
    </nav>
  );
}