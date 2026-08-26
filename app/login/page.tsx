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

  const isArabic = language === "ar";

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resetting, setResetting] =
    useState(false);

  const text = {
    pharmacyName: isArabic
      ? "صيدلية الشفاء"
      : "Al Shifa Pharmacy",

    priority: isArabic
      ? "صحتك أولويتنا"
      : "Your health is our priority",

    language: isArabic
      ? "English"
      : "العربية",

    loginTitle: isArabic
      ? "تسجيل الدخول"
      : "Login",

    loginSubtitle: isArabic
      ? "سجل الدخول إلى حسابك"
      : "Sign in to your account",

    email: isArabic
      ? "البريد الإلكتروني"
      : "Email address",

    emailPlaceholder:
      "example@email.com",

    password: isArabic
      ? "كلمة المرور"
      : "Password",

    passwordPlaceholder: isArabic
      ? "اكتب كلمة المرور"
      : "Enter your password",

    forgotPassword: isArabic
      ? "نسيت كلمة المرور؟"
      : "Forgot password?",

    sending: isArabic
      ? "جاري الإرسال..."
      : "Sending...",

    loggingIn: isArabic
      ? "جاري تسجيل الدخول..."
      : "Signing in...",

    loginButton: isArabic
      ? "تسجيل الدخول 🔐"
      : "Login 🔐",

    noAccount: isArabic
      ? "ليس لديك حساب؟"
      : "Don't have an account?",

    createAccount: isArabic
      ? "إنشاء حساب جديد"
      : "Create a new account",

    backHome: isArabic
      ? "← العودة إلى الصفحة الرئيسية"
      : "← Back to homepage",

    fillFields: isArabic
      ? "من فضلك اكتب البريد الإلكتروني وكلمة المرور"
      : "Please enter your email and password.",

    noSession: isArabic
      ? "تم تسجيل الدخول ولكن لم يتم إنشاء جلسة للحساب."
      : "You are logged in, but no session was created for this account.",

    adminSuccess: isArabic
      ? "تم تسجيل دخول الأدمن بنجاح 🎉"
      : "Admin login successful 🎉",

    loginSuccess: isArabic
      ? "تم تسجيل الدخول بنجاح 🎉"
      : "Login successful 🎉",

    loginUnexpected: isArabic
      ? "حدث خطأ غير متوقع، حاول مرة أخرى."
      : "An unexpected error occurred. Please try again.",

    resetFirst: isArabic
      ? "اكتب البريد الإلكتروني أولاً، ثم اضغط نسيت كلمة المرور."
      : "Enter your email first, then click Forgot password.",

    resetSuccess: isArabic
      ? "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني 📩\n\nافتح البريد واضغط على الرابط لتعيين كلمة مرور جديدة."
      : "A password reset link has been sent to your email 📩\n\nOpen the email and click the link to set a new password.",

    resetError: isArabic
      ? "تعذر إرسال رابط استعادة كلمة المرور:\n\n"
      : "Unable to send the password reset link:\n\n",

    resetUnexpected: isArabic
      ? "حدث خطأ غير متوقع أثناء إرسال رابط الاستعادة."
      : "An unexpected error occurred while sending the reset link.",
  };

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !email.trim() ||
      !password
    ) {
      alert(
        text.fillFields
      );

      return;
    }

    if (
      loading ||
      resetting
    ) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email.trim(),
            password,
          }
        );

      if (loginError) {
        console.error(
          "LOGIN ERROR:",
          loginError
        );

        alert(
          loginError.message
        );

        return;
      }

      const user =
        loginData.user;

      const session =
        loginData.session;

      if (
        !user ||
        !session
      ) {
        console.error(
          "LOGIN RESULT WITHOUT SESSION:",
          loginData
        );

        alert(
          text.noSession
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

      let role:
        | string
        | null =
        null;

      try {
        const {
          data: profile,
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .select("role")
            .eq(
              "id",
              user.id
            )
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

      if (
        role ===
        "admin"
      ) {
        alert(
          text.adminSuccess
        );

        router.replace(
          "/admin/dashboard"
        );

        return;
      }

      alert(
        text.loginSuccess
      );

      router.replace("/");
    } catch (error) {
      console.error(
        "LOGIN EXCEPTION:",
        error
      );

      alert(
        text.loginUnexpected
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (
      loading ||
      resetting
    ) {
      return;
    }

    const emailValue =
      email.trim();

    if (!emailValue) {
      alert(
        text.resetFirst
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
          text.resetError +
            error.message
        );

        return;
      }

      alert(
        text.resetSuccess
      );
    } catch (error) {
      console.error(
        "PASSWORD RESET EXCEPTION:",
        error
      );

      alert(
        text.resetUnexpected
      );
    } finally {
      setResetting(
        false
      );
    }
  }

  return (
    <main
      dir={dir}
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">

        {/* اللغة */}

        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={
              toggleLanguage
            }
            className="rounded-lg border border-purple-600 bg-white px-3 py-2 text-sm font-bold text-purple-700 shadow-sm hover:bg-purple-50"
          >
            🌐{" "}
            {
              text.language
            }
          </button>
        </div>

        {/* الشعار */}

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
            💚
          </div>

          <h1 className="mt-5 text-3xl font-bold text-green-700">
            {
              text.pharmacyName
            }
          </h1>

          <p className="mt-2 text-gray-500">
            {
              text.priority
            }
          </p>
        </div>

        {/* العنوان */}

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {
              text.loginTitle
            }
          </h2>

          <p className="mt-2 text-gray-500">
            {
              text.loginSubtitle
            }
          </p>
        </div>

        {/* النموذج */}

        <form
          onSubmit={
            handleLogin
          }
          className="space-y-5"
        >
          {/* البريد */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              {
                text.email
              }
            </label>

            <input
              type="email"
              value={email}
              onChange={(
                e
              ) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder={
                text.emailPlaceholder
              }
              autoComplete="email"
              disabled={
                loading ||
                resetting
              }
              dir="ltr"
              className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
            />
          </div>

          {/* كلمة المرور */}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block font-bold text-gray-700">
                {
                  text.password
                }
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
                  ? text.sending
                  : text.forgotPassword}
              </button>
            </div>

            <input
              type="password"
              value={password}
              onChange={(
                e
              ) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder={
                text.passwordPlaceholder
              }
              autoComplete="current-password"
              disabled={
                loading ||
                resetting
              }
              className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100 ${
                isArabic
                  ? "text-right"
                  : "text-left"
              }`}
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
              ? text.loggingIn
              : text.loginButton}
          </button>
        </form>

        {/* التسجيل */}

        <div className="mt-7 text-center">
          <p className="text-gray-500">
            {
              text.noAccount
            }
          </p>

          <a
            href="/register"
            className="mt-2 inline-block font-bold text-green-600 hover:text-green-700"
          >
            {
              text.createAccount
            }
          </a>
        </div>

        {/* العودة */}

        <div className="mt-6 border-t pt-5 text-center">
          <a
            href="/"
            className="font-semibold text-gray-500 hover:text-green-600"
          >
            {
              text.backHome
            }
          </a>
        </div>
      </div>
    </main>
  );
}