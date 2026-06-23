"use client";

import { useEffect } from "react";
import { useLocaleStore } from "~/store/locale";
import type { Locale } from "~/i18n/types";

/** 客户端水合语言偏好，并返回当前 locale */
export function useLocale(): { locale: Locale; hydrated: boolean } {
  const locale = useLocaleStore((s) => s.locale);
  const hydrated = useLocaleStore((s) => s.hydrated);

  useEffect(() => {
    useLocaleStore.getState().hydrate();
  }, []);

  return { locale, hydrated };
}
