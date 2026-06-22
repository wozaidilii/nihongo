"use client";

import { useEffect, useMemo, useState } from "react";
import type { SpriteAnimState, SpriteDefinition } from "~/types/sprites";

interface PixelAnimatorProps {
  def: SpriteDefinition;
  /** 当前动画状态；找不到时回退 idle */
  state?: SpriteAnimState;
  /** 是否播放帧动画；false 时停在第一帧 */
  playing?: boolean;
  /** 播完非循环动画后回调(如 attack/hurt) */
  onComplete?: () => void;
  className?: string;
  label?: string;
}

/**
 * LPC spritesheet 帧动画播放器。
 * 用 background-position 切帧，保持 pixelated 硬边渲染。
 */
export function PixelAnimator({
  def,
  state = "idle",
  playing = true,
  onComplete,
  className = "",
  label,
}: PixelAnimatorProps) {
  const scale = def.scale ?? 1;
  const fw = def.frameWidth;
  const fh = def.frameHeight;

  const anim = useMemo(() => {
    return def.animations[state] ?? def.animations.idle ?? Object.values(def.animations)[0];
  }, [def, state]);

  const [frameIdx, setFrameIdx] = useState(0);

  // 切换动画状态时从头播放
  useEffect(() => {
    setFrameIdx(0);
  }, [state, anim]);

  const loop = state === "idle" || state === "cast";

  useEffect(() => {
    if (!playing || !anim || anim.frames.length <= 1) return;

    const ms = Math.max(50, Math.round(1000 / (anim.fps || 8)));
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      if (idx >= anim.frames.length) {
        if (loop) {
          idx = 0;
        } else {
          clearInterval(timer);
          onComplete?.();
          return;
        }
      }
      setFrameIdx(idx);
    }, ms);

    return () => clearInterval(timer);
  }, [playing, anim, loop, onComplete]);

  if (!anim) return null;

  const col = anim.frames[frameIdx] ?? anim.frames[0] ?? 0;
  const displayW = fw * scale;
  const displayH = fh * scale;
  const posX = -col * fw * scale;
  const posY = -anim.row * fh * scale;

  return (
    <span
      role="img"
      aria-label={label ?? state}
      className={`inline-block select-none pixelated ${className}`}
      style={{
        width: displayW,
        height: displayH,
        backgroundImage: `url(${def.sheet})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${posX}px ${posY}px`,
        backgroundSize: `${def.sheetWidth * scale}px ${def.sheetHeight * scale}px`,
        transform: def.flipX ? "scaleX(-1)" : undefined,
      }}
    />
  );
}
