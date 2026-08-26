"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";

export default function LoginPage() {
  const router = useRouter();

  const {
    language,
    toggleLanguage,
    dir,
  } = useLanguage();

  const isArabic =
    language === "ar";

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resetting, setResetting] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert(
        isArabic
          ? "من فضلك اكتب البريد الإلكتروني وكلمة المرور"
          : "Please enter your email and password."
      );

      return;
    }

    if (loading || resetting) {
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

      const user =
        loginData.user;

      const session =
        loginData.session;

      if (!user || !session) {
        console.error(
          "LOGIN RESULT WITHOUT SESSION:",
          loginData
        );

        alert(
          isArabic
            ? "تم تسجيل الدخول ولكن لم يتم إنشاء جلسة للحساب."
            : "Login succeeded, but no session was created."
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
      // =====================================================

      let role: string | null =
        null;

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
            profile?.role ||
            null;
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
          isArabic
            ? "تم تسجيل دخول الأدمن بنجاح 🎉"
            : "Admin login successful 🎉"
        );

        router.replace(
          "/admin/dashboard"
        );

        return;
      }

      alert(
        isArabic
          ? "تم تسجيل الدخول بنجاح 🎉"
          : "Login successful 🎉"
      );

      router.replace("/");
    } catch (error) {
      console.error(
        "LOGIN EXCEPTION:",
        error
      );

      alert(
        isArabic
          ? "حدث خطأ غير متوقع، حاول مرة أخرى."
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // نسيت كلمة المرور
  // =====================================================

  async function handleForgotPassword() {
    if (loading || resetting) {
      return;
    }

    const emailValue =
      email.trim();

    if (!emailValue) {
      alert(
        isArabic
          ? "اكتب البريد الإلكتروني أولاً، ثم اضغط نسيت كلمة المرور."
          : "Enter your email address first, then click Forgot password."
      );

      return;
    }

    setResetting(true);

    try {
      const redirectTo =
        `${window.location.origin}/reset-password`;

      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          emailValue,
          {
            redirectTo,
          }
        );

      if (error) {
        console.error(
          "PASSWORD RESET ERROR:",
          error
        );

        alert(
          isArabic
            ? "تعذر إرسال رابط استعادة كلمة المرور:\n\n" +
                error.message
            : "Unable to send the password reset link:\n\n" +
                error.message
        );

        return;
      }

      alert(
        isArabic
          ? "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني 📩\n\nافتح البريد واضغط على الرابط لتعيين كلمة مرور جديدة."
          : "A password reset link has been sent to your email 📩\n\nOpen your email and click the link to set a new password."
      );
    } catch (error) {
      console.error(
        "PASSWORD RESET EXCEPTION:",
        error
      );

      alert(
        isArabic
          ? "حدث خطأ غير متوقع أثناء إرسال رابط الاستعادة."
          : "An unexpected error occurred while sending the reset link."
      );
    } finally {
      setResetting(false);
    }
  }

  return (
    <main
      dir={dir}
      className={`relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 ${
        isArabic
          ? "text-right"
          : "text-left"
      }`}
    >
      {/* =====================================================
          اختيار اللغة
          ثابت دائمًا أعلى اليسار
      ===================================================== */}

      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-xl border border-green-600 bg-white px-4 py-2 font-bold text-green-700 shadow-sm transition hover:bg-green-50"
        >
          🌐{" "}
          {isArabic
            ? "English"
            : "العربية"}
        </button>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        {/* الشعار */}

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
            💚
          </div>

          <h1 className="mt-5 text-3xl font-bold text-green-700">
            {isArabic
              ? "صيدلية الشفاء"
              : "Al Shifa Pharmacy"}
          </h1>

          <p className="mt-2 text-gray-500">
            {isArabic
              ? "صحتك أولويتنا"
              : "Your health is our priority"}
          </p>
        </div>

        {/* العنوان */}

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isArabic
              ? "تسجيل الدخول"
              : "Login"}
          </h2>

          <p className="mt-2 text-gray-500">
            {isArabic
              ? "سجل الدخول إلى حسابك"
              : "Sign in to your account"}
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
              {isArabic
                ? "البريد الإلكتروني"
                : "Email address"}
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="example@email.com"
              autoComplete="email"
              disabled={
                loading ||
                resetting
              }
              dir="ltr"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* كلمة المرور */}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block font-bold text-gray-700">
                {isArabic
                  ? "كلمة المرور"
                  : "Password"}
              </label>

              <button
                type="button"
                onClick={
                  handleForgotPassword
                }
                disabled={
                  loading ||
                  resetting
                }
                className="text-sm font-semibold text-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetting
                  ? isArabic
                    ? "جاري الإرسال..."
                    : "Sending..."
                  : isArabic
                    ? "نسيت كلمة المرور؟"
                    : "Forgot password?"}
              </button>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder={
                isArabic
                  ? "اكتب كلمة المرور"
                  : "Enter your password"
              }
              autoComplete="current-password"
              disabled={
                loading ||
                resetting
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* تسجيل الدخول */}

          <button
            type="submit"
            disabled={
              loading ||
              resetting
            }
            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isArabic
                ? "جاري تسجيل الدخول..."
                : "Logging in..."
              : isArabic
                ? "تسجيل الدخول 🔐"
                : "Login 🔐"}
          </button>
        </form>

        {/* التسجيل */}

        <div className="mt-7 text-center">
          <p className="text-gray-500">
            {isArabic
              ? "ليس لديك حساب؟"
              : "Don't have an account?"}
          </p>

          <a
            href="/register"
            className="mt-2 inline-block font-bold text-green-600 hover:text-green-700"
          >
            {isArabic
              ? "إنشاء حساب جديد"
              : "Create a new account"}
          </a>
        </div>

        {/* العودة */}

        <div className="mt-6 border-t pt-5 text-center">
          <a
            href="/"
            className="font-semibold text-gray-500 hover:text-green-600"
          >
            {isArabic
              ? "← العودة إلى الصفحة الرئيسية"
              : "← Back to home page"}
          </a>
        </div>
      </div>
    </main>
  );
}