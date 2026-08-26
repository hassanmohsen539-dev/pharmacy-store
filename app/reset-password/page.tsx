"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (session?.user) {
          setReady(true);
        } else {
          setReady(false);

          alert(
            "رابط استعادة كلمة المرور غير صالح أو انتهت صلاحيته."
          );
        }
      } catch (error) {
        console.error(
          "RECOVERY SESSION ERROR:",
          error
        );

        if (mounted) {
          setReady(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpdatePassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (saving) {
      return;
    }

    if (password.length < 6) {
      alert(
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
      );

      return;
    }

    if (password !== confirmPassword) {
      alert(
        "كلمتا المرور غير متطابقتين."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error(
          "UPDATE PASSWORD ERROR:",
          error
        );

        alert(
          "تعذر تغيير كلمة المرور:\n\n" +
            error.message
        );

        return;
      }

      alert(
        "تم تغيير كلمة المرور بنجاح ✅\n\nيمكنك الآن تسجيل الدخول بكلمة المرور الجديدة."
      );

      router.replace("/login");
    } catch (error) {
      console.error(
        "UPDATE PASSWORD EXCEPTION:",
        error
      );

      alert(
        "حدث خطأ غير متوقع أثناء تغيير كلمة المرور."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="text-6xl">
            🔐
          </div>

          <h1 className="mt-5 text-2xl font-bold text-green-700">
            التحقق من رابط الاستعادة...
          </h1>

          <p className="mt-3 text-gray-500">
            برجاء الانتظار
          </p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="text-6xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-bold text-red-600">
            رابط غير صالح
          </h1>

          <p className="mt-3 text-gray-600">
            افتح رابط استعادة كلمة المرور من بريدك الإلكتروني مرة أخرى.
          </p>

          <button
            onClick={() =>
              router.replace("/login")
            }
            className="mt-6 w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
            🔐
          </div>

          <h1 className="mt-5 text-3xl font-bold text-green-700">
            صيدلية الشفاء
          </h1>

          <p className="mt-2 text-gray-500">
            تعيين كلمة مرور جديدة
          </p>
        </div>

        <form
          onSubmit={
            handleUpdatePassword
          }
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block font-bold text-gray-700">
              كلمة المرور الجديدة
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="اكتب كلمة المرور الجديدة"
              autoComplete="new-password"
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-gray-700">
              تأكيد كلمة المرور
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
              placeholder="اكتب كلمة المرور مرة أخرى"
              autoComplete="new-password"
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          <p className="text-sm text-gray-500">
            يجب أن تكون كلمة المرور 6 أحرف على الأقل.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "جاري حفظ كلمة المرور..."
              : "حفظ كلمة المرور 🔐"}
          </button>
        </form>

        <div className="mt-6 border-t pt-5 text-center">
          <button
            type="button"
            onClick={() =>
              router.replace("/login")
            }
            className="font-semibold text-gray-500 hover:text-green-600"
          >
            ← العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    </main>
  );
}