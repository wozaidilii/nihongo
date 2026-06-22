interface HpBarProps {
  current: number;
  max: number;
  /** 标签(如 角色名) */
  label?: string;
  /** 条的颜色调性 */
  tone?: "hero" | "enemy";
}

/** 像素风 HP 条，阶梯式增减 */
export function HpBar({ current, max, label, tone = "hero" }: HpBarProps) {
  const safeMax = max > 0 ? max : 1;
  const safeCur = Math.max(0, Math.min(current, safeMax));
  const ratio = safeCur / safeMax;
  const pct = Math.round(ratio * 100);

  // 血量越低越红
  const fillColor =
    ratio > 0.5
      ? "var(--color-rpg-7)"
      : ratio > 0.25
        ? "var(--color-rpg-5)"
        : "var(--color-rpg-3)";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-end justify-between gap-2">
        {label ? (
          <span className="font-jp text-sm text-rpg-13">{label}</span>
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
        aria-label={tone === "enemy" ? "敌人血量" : "勇者血量"}
      >
        <div
          className="pixel-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}
