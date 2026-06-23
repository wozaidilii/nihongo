"use client";

import type { Stage } from "~/types";
import type { Locale } from "~/i18n/types";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import { getBossName, getStageTitle, formatMessage, messages, t } from "~/i18n";
import { getBossEncounter } from "~/data/stages";

interface MapNodeProps {
  stage: Stage;
  locale: Locale;
  unlocked: boolean;
  cleared: boolean;
  onEnter: (stageId: string) => void;
}

/** 地图上的一个关卡节点 */
export function MapNode({ stage, locale, unlocked, cleared, onEnter }: MapNodeProps) {
  const disabled = !unlocked;
  const boss = getBossEncounter(stage);
  const bossEnemy = boss?.enemy;
  const enemyName = getBossName(stage, locale);
  const stageTitle = getStageTitle(stage, locale);

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
          {unlocked && bossEnemy ? (
            <CharacterSprite
              kind="enemy"
              id={bossEnemy.spriteKey}
              fallbackGlyph={bossEnemy.sprite}
              state="idle"
              bob={!cleared}
              label={enemyName}
            />
          ) : (
            <PixelSprite glyph="🔒" size={44} />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-pixel text-sm text-rpg-5">
                {stage.order}. {stageTitle}
              </p>
              {cleared && (
                <span className="font-pixel text-[10px] text-rpg-6">
                  {t(messages.map.cleared, locale)}
                </span>
              )}
            </div>
            <p className="font-jp text-xs text-rpg-14">
              {formatMessage(t(messages.map.enemy, locale), { name: enemyName })}
            </p>
          </div>
        </div>
        {!unlocked && (
          <p className="mt-2 font-jp text-[11px] text-rpg-14">
            {t(messages.map.unlockHint, locale)}
          </p>
        )}
      </PixelPanel>
    </button>
  );
}
