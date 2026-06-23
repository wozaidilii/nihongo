"use client";

import type { HeroClassId } from "~/types";
import type { Locale } from "~/i18n/types";
import { getAvailableSkillPicks } from "~/data/skillTree";
import { SkillTreeView } from "~/components/game/SkillTreeView";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { messages, t } from "~/i18n";

interface SkillTreeModalProps {
  classId: HeroClassId;
  level: number;
  locale: Locale;
  unlockedIds: string[];
  onPick: (nodeId: string) => void;
  onClose?: () => void;
}

/** 升级后选择技能树分支 */
export function SkillTreeModal({
  classId,
  level,
  locale,
  unlockedIds,
  onPick,
  onClose,
}: SkillTreeModalProps) {
  const picks = getAvailableSkillPicks(classId, level, unlockedIds);
  if (picks.length === 0) return null;

  const tier1Pick = picks.some((p) => p.tier === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <PixelPanel tone="dialog" className="max-h-[85dvh] w-full max-w-lg overflow-y-auto sm:max-h-[90vh]">
        <h2 className="font-pixel text-sm text-rpg-5">
          {tier1Pick ? t(messages.skillTree.pickRoute, locale) : t(messages.skillTree.advance, locale)}
        </h2>
        <p className="mt-2 font-jp text-xs text-rpg-14">
          {tier1Pick
            ? t(messages.skillTree.pickRouteHint, locale)
            : t(messages.skillTree.advanceHint, locale)}
        </p>

        <div className="mt-4">
          <SkillTreeView
            classId={classId}
            level={level}
            locale={locale}
            unlockedIds={unlockedIds}
            onPick={onPick}
          />
        </div>

        {onClose && (
          <div className="mt-4 flex justify-center">
            <PixelButton onClick={onClose}>{t(messages.skillTree.later, locale)}</PixelButton>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
