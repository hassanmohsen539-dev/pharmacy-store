"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export default function AdminNavigation() {
  const pathname =
    usePathname();

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [checkingAdmin, setCheckingAdmin] =
    useState(true);

  async function checkAdmin(
    session: Session | null
  ) {
    if (!session?.user) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    try {
      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select("role")
          .eq(
            "id",
            session.user.id
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "ADMIN PROFILE ERROR:",
          profileError
        );

        setIsAdmin(false);
        return;
      }

      setIsAdmin(
        profile?.role ===
          "admin"
      );
    } catch (error) {
      console.error(
        "CHECK ADMIN ERROR:",
        error
      );

      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    // =====================================================
    // فحص الجلسة مرة واحدة فقط
    // =====================================================

    async function initialize() {
      try {
        const {
          data: {
            session,
          },
          error,
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "ADMIN INITIAL SESSION ERROR:",
            error
          );

          setIsAdmin(false);
          setCheckingAdmin(false);
          return;
        }

        await checkAdmin(
          session
        );
      } catch (error) {
        console.error(
          "ADMIN INITIAL CHECK ERROR:",
          error
        );

        if (mounted) {
          setIsAdmin(false);
          setCheckingAdmin(false);
        }
      }
    }

    void initialize();

    // =====================================================
    // متابعة تغييرات Auth
    // بدون getSession إضافي
    // =====================================================

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event: AuthChangeEvent,
          session: Session | null
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "ADMIN AUTH EVENT:",
            event
          );

          if (
            event ===
              "SIGNED_OUT" ||
            !session
          ) {
            setIsAdmin(false);
            setCheckingAdmin(false);
            return;
          }

          await checkAdmin(
            session
          );
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // صفحات الأدمن لها شريطها الخاص
  if (
    pathname.startsWith(
      "/admin"
    )
  ) {
    return null;
  }

  if (
    checkingAdmin
  ) {
    return null;
  }

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