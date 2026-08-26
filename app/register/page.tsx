"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";

export default function RegisterPage() {
  const {
    language,
    toggleLanguage,
    dir,
  } = useLanguage();

  const isArabic =
    language === "ar";

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      alert(
        isArabic
          ? "من فضلك املأ جميع البيانات"
          : "Please fill in all fields."
      );

      return;
    }

    if (password.length < 6) {
      alert(
        isArabic
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      alert(
        isArabic
          ? "كلمتا المرور غير متطابقتين"
          : "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            email.trim(),
          password,
          options: {
            data: {
              name:
                name.trim(),
              phone:
                phone.trim(),
            },
          },
        });

      if (error) {
        alert(
          error.message
        );

        return;
      }

      if (data.user) {
        alert(
          isArabic
            ? "تم إنشاء الحساب بنجاح 🎉\n\nلو طلب منك تأكيد البريد الإلكتروني، افتح الإيميل واضغط على رابط التأكيد."
            : "Your account was created successfully 🎉\n\nIf email confirmation is required, open your email and click the confirmation link."
        );

        window.location.href =
          "/login";
      }
    } catch (error) {
      console.error(
        error
      );

      alert(
        isArabic
          ? "حدث خطأ غير متوقع، حاول مرة أخرى"
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={dir}
      className="relative flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10"
    >
      {/* =====================================================
          اختيار اللغة
          ثابت دائمًا أعلى اليسار
      ===================================================== */}

      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <button
          type="button"
          onClick={
            toggleLanguage
          }
          className="rounded-xl border border-green-600 bg-white px-4 py-2 font-bold text-green-700 shadow-sm transition hover:bg-green-50"
        >
          🌐{" "}
          {isArabic
            ? "English"
            : "العربية"}
        </button>
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        {/* Logo */}

        <div className="mb-7 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
            💚
          </div>

          <h1 className="mt-4 text-3xl font-bold text-green-700">
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

        {/* Title */}

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isArabic
              ? "إنشاء حساب جديد"
              : "Create a new account"}
          </h2>

          <p className="mt-2 text-gray-500">
            {isArabic
              ? "أنشئ حسابك للطلب بسهولة وأمان"
              : "Create your account to order easily and securely"}
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={
            handleRegister
          }
          className="space-y-5"
        >
          {/* Name */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              {isArabic
                ? "الاسم بالكامل"
                : "Full name"}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder={
                isArabic
                  ? "اكتب اسمك بالكامل"
                  : "Enter your full name"
              }
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Email */}

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
              disabled={loading}
              dir="ltr"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Phone */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              {isArabic
                ? "رقم الموبايل"
                : "Phone number"}
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              placeholder={
                isArabic
                  ? "01xxxxxxxxx"
                  : "01xxxxxxxxx"
              }
              disabled={loading}
              dir="ltr"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              {isArabic
                ? "كلمة المرور"
                : "Password"}
            </label>

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
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Confirm Password */}

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              {isArabic
                ? "تأكيد كلمة المرور"
                : "Confirm password"}
            </label>

            <input
              type="password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder={
                isArabic
                  ? "اكتب كلمة المرور مرة أخرى"
                  : "Enter your password again"
              }
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Register Button */}

          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isArabic
                ? "جاري إنشاء الحساب..."
                : "Creating account..."
              : isArabic
                ? "إنشاء الحساب ✅"
                : "Create account ✅"}
          </button>
        </form>

        {/* Login */}

        <div className="mt-7 text-center">
          <p className="text-gray-500">
            {isArabic
              ? "لديك حساب بالفعل؟"
              : "Already have an account?"}
          </p>

          <a
            href="/login"
            className="mt-2 inline-block font-bold text-green-600 hover:text-green-700"
          >
            {isArabic
              ? "تسجيل الدخول 🔐"
              : "Login 🔐"}
          </a>
        </div>

        {/* Home */}

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