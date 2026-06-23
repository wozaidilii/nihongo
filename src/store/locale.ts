"use client";

import { create } from "zustand";
import { parseLocale, type Locale } from "~/i18n/types";

const STORAGE_KEY = "nihongo-locale";

interface LocaleStore {
  locale: Locale;
  hydrated: boolean;
  hydrate: () => void;
  setLocale: (locale: Locale) => void;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  try {
    return parseLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "zh";
  }
}

function applyDocumentLang(locale: Locale) {
  if (typeof document === "undefined") return;
  const lang = locale === "zh" ? "zh-CN" : locale === "ja" ? "ja" : "en";
  document.documentElement.lang = lang;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: "zh",
  hydrated: false,
  hydrate: () => {
    const locale = readStoredLocale();
    applyDocumentLang(locale);
    set({ locale, hydrated: true });
  },
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* 私密模式等忽略 */
    }
    applyDocumentLang(locale);
    set({ locale });
  },
}));
