"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "~/i18n/types";
import { useLocaleStore } from "~/store/locale";

/** 主页右上角：中 / 日 / 英 语言切换 */
export function LocaleSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div
      className="fixed z-50 flex gap-1"
      style={{
        top: "max(0.75rem, env(safe-area-inset-top, 0px))",
        right: "max(0.75rem, env(safe-area-inset-right, 0px))",
      }}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            aria-pressed={active}
            className={`touch-target font-pixel border-2 px-2.5 py-2 text-[9px] leading-none transition-colors sm:px-2 sm:py-1.5 sm:text-[9px] ${
              active
                ? "border-rpg-5 bg-rpg-5 text-rpg-1 shadow-[2px_2px_0_0_#000]"
                : "border-rpg-13 bg-rpg-1/90 text-rpg-12 hover:border-rpg-8 hover:text-rpg-5"
            }`}
          >
            {LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
