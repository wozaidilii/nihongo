"use client";

import { PixelAnimator } from "~/components/pixel/PixelAnimator";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import { getEnemySprite, getHeroSprite } from "~/data/sprites";
import type { HeroClassId } from "~/types";
import type { SpriteAnimState } from "~/types/sprites";

interface CharacterSpriteProps {
  kind: "hero" | "enemy";
  id: string;
  fallbackGlyph: string;
  state?: SpriteAnimState;
  playing?: boolean;
  onComplete?: () => void;
  bob?: boolean;
  className?: string;
  label?: string;
}

/** 勇者/怪物统一入口：有 LPC 配置则播动画，否则回退 emoji */
export function CharacterSprite({
  kind,
  id,
  fallbackGlyph,
  state = "idle",
  playing = true,
  onComplete,
  bob = false,
  className = "",
  label,
}: CharacterSpriteProps) {
  const def =
    kind === "hero"
      ? getHeroSprite(id as HeroClassId)
      : getEnemySprite(id);

  if (!def) {
    return (
      <PixelSprite
        glyph={fallbackGlyph}
        size={64}
        bob={bob}
        className={className}
        label={label}
      />
    );
  }

  return (
    <span className={`inline-block ${bob ? "anim-bob" : ""} ${className}`}>
      <PixelAnimator
        def={def}
        state={state}
        playing={playing}
        onComplete={onComplete}
        label={label}
      />
    </span>
  );
}
