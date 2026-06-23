"use client";

import type { HeroClassId } from "~/types";
import type { Locale } from "~/i18n/types";
import { getNextUnlockableBattleSkill } from "~/data/skills";
import { iconKeyForSkill } from "~/data/skillIcons";
import { useGameStore } from "~/store/game";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import {
  getElementLabel,
  getSkillDisplayName,
  getSkillMeaning,
  messages,
  t,
} from "~/i18n";

interface SkillUnlockModalProps {
  classId: HeroClassId;
  locale: Locale;
  onClose?: () => void;
}

/** 地图页：消耗技能点解锁下一咒文 */
export function SkillUnlockModal({ classId, locale, onClose }: SkillUnlockModalProps) {
  const clearedStageIds = useGameStore((s) => s.clearedStageIds);
  const unlockedSkillIds = useGameStore((s) => s.unlockedSkillIds);
  const unlockBattleSkill = useGameStore((s) => s.unlockBattleSkill);
  const hasPendingBattleSkillUnlock = useGameStore((s) => s.hasPendingBattleSkillUnlock);

  const nextSkill = getNextUnlockableBattleSkill(
    classId,
    clearedStageIds,
    unlockedSkillIds,
  );

  if (!hasPendingBattleSkillUnlock() || !nextSkill) return null;

  const handleUnlock = () => {
    unlockBattleSkill(nextSkill.id);
    if (!useGameStore.getState().hasPendingBattleSkillUnlock()) {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <PixelPanel tone="dialog" className="w-full max-w-lg">
        <h2 className="font-pixel text-sm text-rpg-5">
          {t(messages.battle.skillUnlockTitle, locale)}
        </h2>
        <p className="mt-2 font-jp text-xs text-rpg-14">
          {t(messages.battle.skillUnlockHint, locale)}
        </p>

        <button
          type="button"
          onClick={handleUnlock}
          className="touch-target mt-4 w-full rounded border-2 border-rpg-8 bg-rpg-13/50 p-3 text-left transition-colors hover:border-rpg-5"
        >
          <div className="flex items-center gap-3">
            <SkillIcon
              iconKey={iconKeyForSkill(nextSkill.fxKey)}
              size={32}
              title={getSkillDisplayName(nextSkill, locale)}
            />
            <div className="min-w-0 flex-1">
              <p className="font-jp text-sm text-rpg-5">
                {getSkillDisplayName(nextSkill, locale)}
              </p>
              <p className="font-jp text-[10px] text-rpg-14">
                {getElementLabel(nextSkill.element ?? "neutral", locale)} ·{" "}
                {getSkillMeaning(nextSkill, locale)}
              </p>
            </div>
          </div>
        </button>

        {onClose && (
          <div className="mt-4 flex justify-center">
            <PixelButton onClick={onClose}>{t(messages.skillTree.later, locale)}</PixelButton>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
