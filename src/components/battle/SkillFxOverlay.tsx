"use client";

import { useEffect, useState } from "react";
import { PixelAnimator } from "~/components/pixel/PixelAnimator";
import { getFxSprite } from "~/data/sprites";
import type { SkillFxKey } from "~/types";

interface SkillFxOverlayProps {
  fxKey: SkillFxKey | null;
  /** 每次施法递增，触发重新播放 */
  triggerKey: number;
  className?: string;
}

/**
 * 技能命中时在敌人身上播放的专用特效。
 * triggerKey 变化时从头播放一次非循环动画。
 */
export function SkillFxOverlay({ fxKey, triggerKey, className = "" }: SkillFxOverlayProps) {
  const def = fxKey ? getFxSprite(fxKey) : undefined;
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!def || triggerKey <= 0) return;
    setVisible(true);
    setPlaying(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setPlaying(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [def, triggerKey]);

  if (!def || !visible) return null;

  return (
    <span className={`battle-fx battle-fx-${fxKey} ${className}`} aria-hidden="true">
      <span className="battle-fx-trail" />
      <span className="battle-fx-sprite">
        <PixelAnimator
          def={def}
          state="play"
          playing={playing}
          onComplete={() => setVisible(false)}
        />
      </span>
      <span className="battle-fx-impact" />
    </span>
  );
}
