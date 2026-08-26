"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert(
        "من فضلك اكتب البريد الإلكتروني وكلمة المرور"
      );
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // تسجيل الدخول
      // =====================================================

      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error(
          "LOGIN ERROR:",
          loginError
        );

        alert(loginError.message);
        return;
      }

      // =====================================================
      // نتأكد أن Supabase أعادت User + Session
      // =====================================================

      const user = loginData.user;
      const session = loginData.session;

      if (!user || !session) {
        console.error(
          "LOGIN RESULT WITHOUT SESSION:",
          loginData
        );

        alert(
          "تم تسجيل الدخول ولكن لم يتم إنشاء جلسة للحساب."
        );

        return;
      }

      console.log(
        "LOGIN SUCCESS:",
        user.id
      );

      console.log(
        "LOGIN SESSION EXISTS:",
        !!session
      );

      // =====================================================
      // فحص صلاحية الحساب
      // لا نستخدم getSession هنا
      // =====================================================

      let role: string | null = null;

      try {
        const {
          data: profile,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error(
            "PROFILE ERROR:",
            profileError
          );
        } else {
          role =
            profile?.role || null;
        }
      } catch (error) {
        console.error(
          "PROFILE CHECK ERROR:",
          error
        );
      }

      // =====================================================
      // التوجيه
      // =====================================================

      if (role === "admin") {
        alert(
          "تم تسجيل دخول الأدمن بنجاح 🎉"
        );

        router.replace(
          "/admin/dashboard"
        );

        return;
      }

      alert(
        "تم تسجيل الدخول بنجاح 🎉"
      );

      router.replace("/");
    } catch (error) {
      console.error(
        "LOGIN EXCEPTION:",
        error
      );

      alert(
        "حدث خطأ غير متوقع، حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-6"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* الشعار */}

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
            💚
          </div>

          <h1 className="mt-5 text-3xl font-bold text-green-700">
            صيدلية الشفاء
          </h1>

          <p className="mt-2 text-gray-500">
            صحتك أولويتنا
          </p>
        </div>

        {/* العنوان */}

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            تسجيل الدخول
          </h2>

          <p className="mt-2 text-gray-500">
            سجل الدخول إلى حسابك
          </p>
        </div>

        {/* النموذج */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* البريد */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              البريد الإلكتروني
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="example@email.com"
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* كلمة المرور */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              كلمة المرور
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="اكتب كلمة المرور"
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* تسجيل الدخول */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "تسجيل الدخول 🔐"}
          </button>
        </form>

        {/* التسجيل */}

        <div className="mt-7 text-center">
          <p className="text-gray-500">
            ليس لديك حساب؟
          </p>

          <a
            href="/register"
            className="mt-2 inline-block font-bold text-green-600 hover:text-green-700"
          >
            إنشاء حساب جديد
          </a>
        </div>

        {/* العودة */}

        <div className="mt-6 border-t pt-5 text-center">
          <a
            href="/"
            className="font-semibold text-gray-500 hover:text-green-600"
          >
            ← العودة إلى الصفحة الرئيسية
          </a>
        </div>
      </div>
    </main>
  );
}