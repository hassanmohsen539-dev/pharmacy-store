"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !phone || !password || !confirmPassword) {
      alert("من فضلك املأ جميع البيانات");
      return;
    }

    if (password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      alert("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone,
          },
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        alert(
          "تم إنشاء الحساب بنجاح 🎉\n\nلو طلب منك تأكيد البريد الإلكتروني، افتح الإيميل واضغط على رابط التأكيد."
        );

        window.location.href = "/login";
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">

        {/* Logo */}
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
            💚
          </div>

          <h1 className="mt-4 text-3xl font-bold text-green-700">
            صيدلية الشفاء
          </h1>

          <p className="mt-2 text-gray-500">
            صحتك أولويتنا
          </p>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            إنشاء حساب جديد
          </h2>

          <p className="mt-2 text-gray-500">
            أنشئ حسابك للطلب بسهولة وأمان
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">

          {/* Name */}
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              الاسم بالكامل
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك بالكامل"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              البريد الإلكتروني
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              رقم الموبايل
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              كلمة المرور
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اكتب كلمة المرور"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              تأكيد كلمة المرور
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="اكتب كلمة المرور مرة أخرى"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب ✅"}
          </button>

        </form>

        {/* Login */}
        <div className="mt-7 text-center">
          <p className="text-gray-500">
            لديك حساب بالفعل؟
          </p>

          <a
            href="/login"
            className="mt-2 inline-block font-bold text-green-600 hover:text-green-700"
          >
            تسجيل الدخول 🔐
          </a>
        </div>

        {/* Home */}
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