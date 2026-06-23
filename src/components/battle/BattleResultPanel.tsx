"use client";

import { useMemo } from "react";
import type { HeroClassId, StageClearResult } from "~/types";
import type { Locale } from "~/i18n/types";
import { getNextUnlockableBattleSkill } from "~/data/skills";
import { iconKeyForSkill } from "~/data/skillIcons";
import { useGameStore } from "~/store/game";
import { DialogueBox } from "~/components/battle/DialogueBox";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import {
  formatMessage,
  getElementLabel,
  getSkillDisplayName,
  getSkillMeaning,
  messages,
  t,
} from "~/i18n";

interface BattleResultPanelProps {
  classId: HeroClassId;
  locale: Locale;
  bossLabel: string;
  clearResult: StageClearResult;
  hasNextStage: boolean;
  onNextStage: () => void;
  onBackToMap: () => void;
}

/** 战斗胜利结算：经验、升级、咒文解锁 */
export function BattleResultPanel({
  classId,
  locale,
  bossLabel,
  clearResult,
  hasNextStage,
  onNextStage,
  onBackToMap,
}: BattleResultPanelProps) {
  const clearedStageIds = useGameStore((s) => s.clearedStageIds);
  const unlockedSkillIds = useGameStore((s) => s.unlockedSkillIds);
  const unlockBattleSkill = useGameStore((s) => s.unlockBattleSkill);
  const hasPendingBattleSkillUnlock = useGameStore((s) => s.hasPendingBattleSkillUnlock);

  const nextUnlockable = useMemo(
    () => getNextUnlockableBattleSkill(classId, clearedStageIds, unlockedSkillIds),
    [classId, clearedStageIds, unlockedSkillIds],
  );

  const pendingUnlock = hasPendingBattleSkillUnlock();
  const canContinue = !pendingUnlock;

  return (
    <div className="flex flex-col gap-4">
      <DialogueBox
        speaker={t(messages.battle.winSpeaker, locale)}
        sprite="🏆"
        text={formatMessage(t(messages.battle.winText, locale), { enemy: bossLabel })}
      />

      <PixelPanel tone="dialog">
        <p className="font-pixel text-[11px] text-rpg-5">
          {t(messages.battle.resultTitle, locale)}
        </p>

        <div className="mt-3 space-y-2 font-jp text-xs text-rpg-12">
          {clearResult.firstClear ? (
            <p>
              {formatMessage(t(messages.battle.resultExp, locale), {
                exp: clearResult.expGained,
              })}
            </p>
          ) : (
            <p className="text-rpg-14">{t(messages.battle.resultRepeat, locale)}</p>
          )}

          {clearResult.leveledUp && (
            <p className="text-rpg-6">
              {formatMessage(t(messages.battle.resultLevelUp, locale), {
                prev: clearResult.prevLevel,
                next: clearResult.newLevel,
              })}
            </p>
          )}
        </div>
      </PixelPanel>

      {pendingUnlock && nextUnlockable && (
        <PixelPanel>
          <p className="font-pixel text-[11px] text-rpg-5">
            {t(messages.battle.skillUnlockTitle, locale)}
          </p>
          <p className="mt-1 font-jp text-xs text-rpg-14">
            {t(messages.battle.skillUnlockHint, locale)}
          </p>
          <button
            type="button"
            onClick={() => unlockBattleSkill(nextUnlockable.id)}
            className="touch-target mt-3 w-full rounded border-2 border-rpg-8 bg-rpg-13/50 p-3 text-left transition-colors hover:border-rpg-5 hover:bg-rpg-8/30"
          >
            <div className="flex items-center gap-3">
              <SkillIcon
                iconKey={iconKeyForSkill(nextUnlockable.fxKey)}
                size={32}
                title={getSkillDisplayName(nextUnlockable, locale)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-jp text-sm text-rpg-5">
                  {getSkillDisplayName(nextUnlockable, locale)}
                </p>
                <p className="font-jp text-[10px] text-rpg-14">
                  {getElementLabel(nextUnlockable.element ?? "neutral", locale)} ·{" "}
                  {getSkillMeaning(nextUnlockable, locale)}
                </p>
              </div>
              <span className="font-pixel text-[10px] text-rpg-6">
                {t(messages.battle.skillUnlockPick, locale)}
              </span>
            </div>
          </button>
        </PixelPanel>
      )}

      <div className="flex flex-col gap-3">
        {hasNextStage && (
          <PixelButton
            variant="gold"
            className="w-full sm:w-auto"
            disabled={!canContinue}
            onClick={onNextStage}
          >
            {t(messages.battle.nextStage, locale)}
          </PixelButton>
        )}

        {!hasNextStage && (
          <PixelPanel tone="dialog">
            <p className="font-jp text-sm text-rpg-5">
              {t(messages.battle.allCleared, locale)}
            </p>
          </PixelPanel>
        )}

        <PixelButton
          className="w-full sm:w-auto"
          disabled={!canContinue}
          onClick={onBackToMap}
        >
          {t(messages.battle.backToMap, locale)}
        </PixelButton>

        {!canContinue && (
          <p className="text-center font-jp text-[11px] text-rpg-14">
            {t(messages.battle.skillUnlockRequired, locale)}
          </p>
        )}
      </div>
    </div>
  );
}
