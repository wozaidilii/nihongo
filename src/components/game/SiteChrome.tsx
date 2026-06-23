"use client";

import { LocaleSwitcher } from "~/components/game/LocaleSwitcher";
import { useLocale } from "~/hooks/useLocale";

/** 全站外壳：水合语言偏好 + 固定语言切换器 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  useLocale();

  return (
    <>
      <LocaleSwitcher />
      {children}
    </>
  );
}
