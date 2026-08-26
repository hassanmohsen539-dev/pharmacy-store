"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth-provider";

export default function AdminNavigation() {
  const pathname = usePathname();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [checkingAdmin, setCheckingAdmin] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      if (!mounted) {
        return;
      }

      // أثناء تحميل Auth ننتظر
      if (authLoading) {
        setCheckingAdmin(true);
        return;
      }

      // لا يوجد مستخدم
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }

        return;
      }

      try {
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
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
          setCheckingAdmin(false);

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

    void checkAdmin();

    return () => {
      mounted = false;
    };
  }, [
    user,
    authLoading,
  ]);

  // صفحات الأدمن لها شريطها الخاص
  if (
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  // أثناء تحميل Auth أو فحص صلاحية الأدمن
  if (
    authLoading ||
    checkingAdmin
  ) {
    return null;
  }

  // العميل العادي
  if (!isAdmin) {
    return null;
  }

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-[90] w-full border-b bg-white shadow-sm"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-2 px-3 py-3 sm:justify-start sm:gap-3 sm:px-6 sm:py-4">
        <Link
          href="/admin/dashboard"
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 sm:px-5 sm:py-3 sm:text-base"
        >
          📊 لوحة التحكم
        </Link>

        <Link
          href="/admin"
          className="rounded-xl border border-blue-600 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 sm:px-5 sm:py-3 sm:text-base"
        >
          🛒 الطلبات
        </Link>

        <Link
          href="/admin/products"
          className="rounded-xl border border-purple-600 bg-white px-4 py-2.5 text-sm font-bold text-purple-700 transition hover:bg-purple-50 sm:px-5 sm:py-3 sm:text-base"
        >
          📦 المنتجات
        </Link>

        <Link
          href="/admin/products/add"
          className="rounded-xl border border-green-600 bg-white px-4 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50 sm:px-5 sm:py-3 sm:text-base"
        >
          ➕ إضافة منتج
        </Link>

        <Link
          href="/"
          className="rounded-xl border border-gray-400 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 sm:px-5 sm:py-3 sm:text-base"
        >
          🏠 الرئيسية
        </Link>
      </div>
    </nav>
  );
}