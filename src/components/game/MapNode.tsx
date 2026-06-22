"use client";

import type { Stage } from "~/types";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { PixelSprite } from "~/components/pixel/PixelSprite";

interface MapNodeProps {
  stage: Stage;
  unlocked: boolean;
  cleared: boolean;
  onEnter: (stageId: string) => void;
}

/** 地图上的一个关卡节点 */
export function MapNode({ stage, unlocked, cleared, onEnter }: MapNodeProps) {
  const disabled = !unlocked;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onEnter(stage.id)}
      className="block w-full text-left disabled:cursor-not-allowed"
      aria-disabled={disabled}
    >
      <PixelPanel
        className={disabled ? "opacity-60" : "transition-transform hover:-translate-y-1"}
      >
        <div className="flex items-center gap-4">
          {unlocked ? (
            <CharacterSprite
              kind="enemy"
              id={stage.enemy.spriteKey}
              fallbackGlyph={stage.enemy.sprite}
              state="idle"
              bob={!cleared}
              label={stage.enemy.name}
            />
          ) : (
            <PixelSprite glyph="🔒" size={44} />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-pixel text-sm text-rpg-5">
                {stage.order}. {stage.title}
              </p>
              {cleared && (
                <span className="font-pixel text-[10px] text-rpg-6">✔ 已通关</span>
              )}
            </div>
            <p className="font-jp text-xs text-rpg-14">
              敌：{stage.enemy.name}
            </p>
          </div>
        </div>
        {!unlocked && (
          <p className="mt-2 font-jp text-[11px] text-rpg-14">
            通关上一关后解锁
          </p>
        )}
      </PixelPanel>
    </button>
  );
}
