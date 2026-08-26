"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "ar" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (
    language: Language
  ) => void;
  toggleLanguage: () => void;
  isArabic: boolean;
  dir: "rtl" | "ltr";
};

const LanguageContext =
  createContext<LanguageContextType | null>(
    null
  );

const STORAGE_KEY =
  "pharmacy_language";

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("ar");

  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (
        saved === "ar" ||
        saved === "en"
      ) {
        setLanguageState(
          saved
        );
      } else {
        setLanguageState("ar");
      }
    } catch {
      setLanguageState("ar");
    } finally {
      setReady(true);
    }
  }, []);

  function setLanguage(
    nextLanguage: Language
  ) {
    setLanguageState(
      nextLanguage
    );

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        nextLanguage
      );
    } catch {
      // تجاهل خطأ التخزين
    }
  }

  function toggleLanguage() {
    setLanguage(
      language === "ar"
        ? "en"
        : "ar"
    );
  }

  useEffect(() => {
    if (!ready) {
      return;
    }

    document.documentElement.lang =
      language;

    document.documentElement.dir =
      language === "ar"
        ? "rtl"
        : "ltr";

    document.body.dir =
      language === "ar"
        ? "rtl"
        : "ltr";
  }, [
    language,
    ready,
  ]);

  const value =
    useMemo<LanguageContextType>(
      () => ({
        language,
        setLanguage,
        toggleLanguage,
        isArabic:
          language === "ar",
        dir:
          language === "ar"
            ? "rtl"
            : "ltr",
      }),
      [language]
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}