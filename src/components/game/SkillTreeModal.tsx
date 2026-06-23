"use client";

import type { HeroClassId } from "~/types";
import { SKILL_TREES, getAvailableSkillPicks } from "~/data/skillTree";
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

  const branchLabel = (branch: "a" | "b") =>
    branch === "a" ? "分支 A" : "分支 B";

  const tier1Pick = picks.some((p) => p.tier === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <PixelPanel tone="dialog" className="w-full max-w-md">
        <h2 className="font-pixel text-sm text-rpg-5">
          {tier1Pick ? "选择技能路线" : "技能进阶"}
        </h2>
        <p className="mt-2 font-jp text-xs text-rpg-14">
          {tier1Pick
            ? "Lv.2 解锁：请选择一条分支（选定后不可更改）"
            : "Lv.3 解锁：在已选分支中进阶"}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {picks.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onPick(node.id)}
              className="text-left"
            >
              <PixelPanel className="transition hover:border-rpg-5">
                <p className="font-pixel text-[10px] text-rpg-11">
                  {branchLabel(node.branch)} · Tier {node.tier}
                </p>
                <p className="mt-1 font-jp text-base text-rpg-5">{node.nameZh}</p>
                <p className="mt-1 font-jp text-xs text-rpg-12">{node.description}</p>
              </PixelPanel>
            </button>
          ))}
        </div>

        {onClose && (
          <div className="mt-4 flex justify-center">
            <PixelButton onClick={onClose}>稍后选择</PixelButton>
          </div>
        )}

        {/* 已选节点预览 */}
        {unlockedIds.length > 0 && (
          <div className="mt-4 border-t-2 border-rpg-15 pt-3">
            <p className="font-pixel text-[9px] text-rpg-14">已解锁</p>
            <ul className="mt-1 space-y-1">
              {(SKILL_TREES[classId] ?? [])
                .filter((n) => unlockedIds.includes(n.id))
                .map((n) => (
                  <li key={n.id} className="font-jp text-xs text-rpg-12">
                    {n.nameZh} — {n.description}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
