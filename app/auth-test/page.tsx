"use client";

import {
  useEffect,
  useState,
} from "react";
import type {
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type AuthEventLog = {
  id: number;
  event: AuthChangeEvent | "INITIAL SESSION";
  hasSession: boolean;
  userId: string | null;
  email: string | null;
  time: string;
};

type AuthInfo = {
  event: string;
  userId: string | null;
  email: string | null;
  hasSession: boolean;
  checkedAt: string;
};

export default function AuthTestPage() {
  const [info, setInfo] =
    useState<AuthInfo>({
      event: "لم يبدأ الاختبار",
      userId: null,
      email: null,
      hasSession: false,
      checkedAt: "",
    });

  const [error, setError] =
    useState("");

  const [logs, setLogs] =
    useState<AuthEventLog[]>([]);

  const [count, setCount] =
    useState(0);

  function getTime() {
    return new Date().toLocaleTimeString(
      "ar-EG",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  }

  function addLog(
    event: AuthChangeEvent | "INITIAL SESSION",
    session: Session | null
  ) {
    const time = getTime();

    const newLog: AuthEventLog = {
      id:
        Date.now() +
        Math.random(),
      event,
      hasSession:
        !!session,
      userId:
        session?.user?.id ||
        null,
      email:
        session?.user?.email ||
        null,
      time,
    };

    setInfo({
      event,
      userId:
        session?.user?.id ||
        null,
      email:
        session?.user?.email ||
        null,
      hasSession:
        !!session,
      checkedAt:
        time,
    });

    setLogs(
      (
        currentLogs
      ) => {
        const next = [
          ...currentLogs,
          newLog,
        ];

        return next.slice(
          -30
        );
      }
    );

    setCount(
      (
        currentCount
      ) =>
        currentCount + 1
    );
  }

  useEffect(() => {
    let mounted = true;

    // =====================================================
    // مستمع Auth أولًا
    // =====================================================

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event: AuthChangeEvent,
          session: Session | null
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "AUTH TEST EVENT:",
            event,
            session
          );

          addLog(
            event,
            session
          );
        }
      );

    // =====================================================
    // فحص أولي واحد
    // =====================================================

    async function initialCheck() {
      try {
        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          console.error(
            "AUTH TEST INITIAL ERROR:",
            sessionError
          );

          setError(
            sessionError.message
          );

          return;
        }

        addLog(
          "INITIAL SESSION",
          session
        );
      } catch (err) {
        console.error(
          "AUTH TEST INITIAL EXCEPTION:",
          err
        );

        if (mounted) {
          setError(
            err instanceof
              Error
              ? err.message
              : "حدث خطأ غير معروف"
          );
        }
      }
    }

    void initialCheck();

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  function clearLogs() {
    setLogs([]);
    setCount(0);

    setInfo({
      event: "تم مسح السجل",
      userId: null,
      email: null,
      hasSession: false,
      checkedAt: getTime(),
    });

    setError("");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <h1 className="text-2xl font-bold text-green-700 sm:text-3xl">
          اختبار جلسة تسجيل الدخول
        </h1>

        <p className="mt-2 text-gray-500">
          الصفحة دي للتشخيص فقط، وبتسجل كل أحداث
          Supabase Auth بالترتيب.
        </p>

        {/* =====================================================
            الحالة الحالية
        ===================================================== */}

        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              آخر Auth Event
            </p>

            <p className="mt-1 break-words text-blue-700">
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
              {info.email ||
                "لا يوجد"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              User ID
            </p>

            <p className="mt-1 break-all text-xs text-gray-700">
              {info.userId ||
                "لا يوجد"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              آخر تحديث
            </p>

            <p className="mt-1 text-gray-700">
              {info.checkedAt ||
                "—"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-4">
            <p className="font-bold">
              عدد أحداث Auth
            </p>

            <p className="mt-1 text-2xl font-black text-gray-800">
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

        {/* =====================================================
            سجل الأحداث
        ===================================================== */}

        <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-blue-900">
                سجل أحداث Auth
              </h2>

              <p className="mt-1 text-sm text-blue-800">
                آخر 30 حدث بالترتيب.
              </p>
            </div>

            <button
              type="button"
              onClick={
                clearLogs
              }
              className="rounded-xl border border-red-400 bg-white px-4 py-2 font-bold text-red-700"
            >
              🗑️ مسح السجل
            </button>
          </div>

          {!logs.length ? (
            <div className="mt-4 rounded-xl bg-white p-5 text-center text-gray-600">
              لا توجد أحداث حتى الآن.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {logs.map(
                (
                  log,
                  index
                ) => (
                  <div
                    key={
                      log.id
                    }
                    className={`rounded-xl border-2 p-4 ${
                      log.event ===
                      "SIGNED_OUT"
                        ? "border-red-300 bg-red-50"
                        : log.hasSession
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-gray-900">
                          #
                          {index +
                            1}{" "}
                          —{" "}
                          {log.event}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {log.time}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${
                          log.hasSession
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {log.hasSession
                          ? "Session ✅"
                          : "No Session ❌"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-3">
                        <p className="font-bold text-gray-700">
                          Email
                        </p>

                        <p className="mt-1 break-all text-gray-600">
                          {log.email ||
                            "لا يوجد"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="font-bold text-gray-700">
                          User ID
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-600">
                          {log.userId ||
                            "لا يوجد"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            تعليمات
        ===================================================== */}

        <div className="mt-6 rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <p className="font-bold">
            المطلوب في الاختبار:
          </p>

          <p className="mt-2 leading-7">
            سجّل الدخول من الموبايل، ثم افتح هذه الصفحة
            وانتظر دقيقة بدون ما تعمل أي شيء.
            لو ظهر SIGNED_OUT، سيظهر قبله كل الأحداث
            التي حدثت بالترتيب هنا.
          </p>
        </div>

        {/* =====================================================
            العودة
        ===================================================== */}

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