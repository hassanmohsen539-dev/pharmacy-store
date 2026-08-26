"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AuthInfo = {
  event: string;
  userId: string | null;
  email: string | null;
  hasSession: boolean;
  checkedAt: string;
};

export default function AuthTestPage() {
  const [info, setInfo] = useState<AuthInfo>({
    event: "لم يبدأ الاختبار",
    userId: null,
    email: null,
    hasSession: false,
    checkedAt: "",
  });

  const [error, setError] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        setInfo({
          event: "SESSION CHECK",
          userId: session?.user?.id || null,
          email: session?.user?.email || null,
          hasSession: !!session,
          checkedAt: new Date().toLocaleTimeString(
            "ar-EG"
          ),
        });

        setCount((value) => value + 1);
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "حدث خطأ غير معروف"
          );
        }
      }
    }

    checkSession();

    const timer = setInterval(
      checkSession,
      1000
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log(
          "AUTH TEST EVENT:",
          event,
          session
        );

        setInfo({
          event,
          userId:
            session?.user?.id || null,
          email:
            session?.user?.email || null,
          hasSession: !!session,
          checkedAt:
            new Date().toLocaleTimeString(
              "ar-EG"
            ),
        });
      }
    );

    return () => {
      mounted = false;
      clearInterval(timer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-green-700">
          اختبار جلسة تسجيل الدخول
        </h1>

        <p className="mt-2 text-gray-500">
          الصفحة دي للتشخيص فقط.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              Auth Event
            </p>

            <p className="mt-1 text-blue-700">
              {info.event}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              Session
            </p>

            <p
              className={`mt-1 font-bold ${
                info.hasSession
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {info.hasSession
                ? "موجودة ✅"
                : "غير موجودة ❌"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              Email
            </p>

            <p className="mt-1 break-all text-gray-700">
              {info.email || "لا يوجد"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              User ID
            </p>

            <p className="mt-1 break-all text-xs text-gray-700">
              {info.userId || "لا يوجد"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              آخر فحص
            </p>

            <p className="mt-1 text-gray-700">
              {info.checkedAt || "—"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              عدد مرات الفحص
            </p>

            <p className="mt-1 text-gray-700">
              {count}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-red-700">
              <p className="font-bold">
                الخطأ
              </p>

              <p className="mt-1 break-words">
                {error}
              </p>
            </div>
          )}
        </div>

        <a
          href="/"
          className="mt-6 block rounded-xl bg-green-600 py-3 text-center font-bold text-white hover:bg-green-700"
        >
          العودة للموقع
        </a>
      </div>
    </main>
  );
}