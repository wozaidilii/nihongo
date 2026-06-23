"use client";

import type { Locale } from "~/i18n/types";
import { messages, t } from "~/i18n";

interface HpBarProps {
  current: number;
  max: number;
  label?: string;
  tone?: "hero" | "enemy";
  locale?: Locale;
  /** 窄屏时截断名称，避免撑破战斗布局 */
  compactLabel?: boolean;
}

/** 像素风 HP 条，阶梯式增减 */
export function HpBar({
  current,
  max,
  label,
  tone = "hero",
  locale = "zh",
  compactLabel = false,
}: HpBarProps) {
  const safeMax = max > 0 ? max : 1;
  const safeCur = Math.max(0, Math.min(current, safeMax));
  const ratio = safeCur / safeMax;
  const pct = Math.round(ratio * 100);

  const fillColor =
    ratio > 0.5
      ? "var(--color-rpg-7)"
      : ratio > 0.25
        ? "var(--color-rpg-5)"
        : "var(--color-rpg-3)";

  const ariaLabel =
    tone === "enemy"
      ? t(messages.hp.enemy, locale)
      : t(messages.hp.hero, locale);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-end justify-between gap-2">
        {label ? (
          <span
            className={`font-jp text-[10px] text-rpg-13 sm:text-sm ${
              compactLabel ? "max-w-[4.5rem] truncate sm:max-w-none" : ""
            }`}
            title={label}
          >
            {label}
          </span>
        ) : (
          <span />
        )}
        <span className="font-pixel text-[10px] text-rpg-12">
          {safeCur}/{safeMax}
        </span>
      </div>
      <div
        className="pixel-bar h-4 w-full"
        role="progressbar"
        aria-valuenow={safeCur}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={ariaLabel}
      >
        <div
          className="pixel-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}
