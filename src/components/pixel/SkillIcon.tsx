"use client";

import type { SkillIconKey } from "~/data/skillIcons";
import { getSkillIconDef, getSkillIconManifest } from "~/data/skillIcons";

interface SkillIconProps {
  iconKey: SkillIconKey | string;
  /** 显示尺寸(px)，素材为 32×32 */
  size?: number;
  className?: string;
  title?: string;
  /** 未解锁时半透明 */
  dimmed?: boolean;
}

/** 32×32 技能图标（FX 首帧 / 树节点像素图标） */
export function SkillIcon({
  iconKey,
  size = 32,
  className = "",
  title,
  dimmed = false,
}: SkillIconProps) {
  const meta = getSkillIconManifest();
  const def = getSkillIconDef(iconKey);

  if (!def) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-rpg-15 font-pixel text-[8px] text-rpg-1 ${className}`}
        style={{ width: size, height: size }}
        title={title}
      >
        ?
      </span>
    );
  }

  const { frameWidth: fw, frameHeight: fh, sheet } = meta;
  const x = def.col * fw;
  const y = def.row * fh;
  const scale = size / fw;

  return (
    <span
      className={`inline-block shrink-0 ${dimmed ? "opacity-40 grayscale" : ""} ${className}`}
      title={title}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `-${x * scale}px -${y * scale}px`,
        backgroundSize: `${meta.sheetWidth * scale}px ${meta.sheetHeight * scale}px`,
        imageRendering: "pixelated",
      }}
      role="img"
      aria-label={title ?? iconKey}
    />
  );
}
