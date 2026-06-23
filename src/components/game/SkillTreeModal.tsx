"use client";

import type { HeroClassId } from "~/types";
import { getAvailableSkillPicks } from "~/data/skillTree";
import { SkillTreeView } from "~/components/game/SkillTreeView";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";

interface SkillTreeModalProps {
  classId: HeroClassId;
  level: number;
  unlockedIds: string[];
  onPick: (nodeId: string) => void;
  onClose?: () => void;
}

/** 升级后选择技能树分支 */
export function SkillTreeModal({
  classId,
  level,
  unlockedIds,
  onPick,
  onClose,
}: SkillTreeModalProps) {
  const picks = getAvailableSkillPicks(classId, level, unlockedIds);
  if (picks.length === 0) return null;

  const tier1Pick = picks.some((p) => p.tier === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <PixelPanel tone="dialog" className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <h2 className="font-pixel text-sm text-rpg-5">
          {tier1Pick ? "选择技能路线" : "技能进阶"}
        </h2>
        <p className="mt-2 font-jp text-xs text-rpg-14">
          {tier1Pick
            ? "Lv.2 解锁：点击分支节点选择（选定后不可更改）"
            : "Lv.3 解锁：点击节点完成进阶"}
        </p>

        <div className="mt-4">
          <SkillTreeView
            classId={classId}
            level={level}
            unlockedIds={unlockedIds}
            onPick={onPick}
          />
        </div>

        {onClose && (
          <div className="mt-4 flex justify-center">
            <PixelButton onClick={onClose}>稍后选择</PixelButton>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
