"use client";

import type { HeroClassId } from "~/types";
import {
  SKILL_TREES,
  getAvailableSkillPicks,
  getChosenBranch,
} from "~/data/skillTree";
import {
  CLASS_ROOT_ICON,
  SKILL_TREE_ICON,
  type SkillIconKey,
} from "~/data/skillIcons";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import { PixelPanel } from "~/components/pixel/PixelPanel";

type NodeState = "locked" | "available" | "unlocked";

interface SkillTreeViewProps {
  classId: HeroClassId;
  level: number;
  unlockedIds: string[];
  onPick?: (nodeId: string) => void;
  compact?: boolean;
}

function nodeState(
  nodeId: string,
  level: number,
  unlockLevel: number,
  unlocked: Set<string>,
  available: Set<string>,
): NodeState {
  if (unlocked.has(nodeId)) return "unlocked";
  if (available.has(nodeId)) return "available";
  if (level >= unlockLevel) return "locked";
  return "locked";
}

/** 经典双分支技能树可视化（参考 D2/POE 简化：根 → A/B → A2/B2） */
export function SkillTreeView({
  classId,
  level,
  unlockedIds,
  onPick,
  compact = false,
}: SkillTreeViewProps) {
  const nodes = SKILL_TREES[classId] ?? [];
  const branchA = nodes.filter((n) => n.branch === "a");
  const branchB = nodes.filter((n) => n.branch === "b");
  const unlocked = new Set(unlockedIds);
  const available = new Set(
    getAvailableSkillPicks(classId, level, unlockedIds).map((n) => n.id),
  );
  const chosen = getChosenBranch(classId, unlockedIds);

  const renderNode = (
    nodeId: string,
    name: string,
    desc: string,
    iconKey: SkillIconKey,
    tier: number,
    state: NodeState,
  ) => {
    const clickable = state === "available" && onPick;
    const border =
      state === "unlocked"
        ? "border-rpg-6"
        : state === "available"
          ? "border-rpg-5 anim-title-blink"
          : "border-rpg-15";

    const inner = (
      <div
        className={`flex flex-col items-center gap-1 rounded border-2 ${border} bg-rpg-13/80 p-2 ${
          compact ? "min-w-[72px]" : "min-w-[88px]"
        }`}
      >
        <SkillIcon iconKey={iconKey} size={compact ? 28 : 32} dimmed={state === "locked"} title={name} />
        <p className="font-jp text-center text-[10px] leading-tight text-rpg-5">{name}</p>
        {!compact && (
          <p className="font-jp text-center text-[9px] leading-tight text-rpg-14">{desc}</p>
        )}
        <span className="font-pixel text-[8px] text-rpg-11">T{tier}</span>
      </div>
    );

    if (clickable) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return inner;
      return (
        <button type="button" onClick={() => onPick(node.id)} className="text-left">
          {inner}
        </button>
      );
    }
    return inner;
  };

  const rootIcon = CLASS_ROOT_ICON[classId];

  const tier1A = branchA.find((n) => n.tier === 1);
  const tier2A = branchA.find((n) => n.tier === 2);
  const tier1B = branchB.find((n) => n.tier === 1);
  const tier2B = branchB.find((n) => n.tier === 2);

  return (
    <PixelPanel className="overflow-x-auto">
      <p className="font-pixel text-[10px] text-rpg-5">技能树 · 双分支</p>
      <p className="mt-1 font-jp text-[10px] text-rpg-14">
        参考经典 RPG 双分支：Lv.2 选路线，Lv.3 在同路线进阶
        {chosen ? ` · 当前：分支 ${chosen.toUpperCase()}` : ""}
      </p>

      <div className="mt-4 flex min-w-[280px] flex-col items-center gap-3">
        {/* 根节点 */}
        <div className="flex flex-col items-center">
          {renderNode("root", "基础咒文", "Lv.1 默认", rootIcon, 0, "unlocked")}
          <div className="h-3 w-0.5 bg-rpg-15" />
          <div className="flex w-full max-w-xs justify-center gap-8">
            <div className="h-0.5 flex-1 self-center bg-rpg-15" />
            <div className="h-0.5 flex-1 self-center bg-rpg-15" />
          </div>
        </div>

        {/* Tier 1 二选一 */}
        <div className="flex w-full max-w-sm justify-between gap-4 px-2">
          {tier1A &&
            renderNode(
              tier1A.id,
              tier1A.nameZh,
              tier1A.description,
              SKILL_TREE_ICON[tier1A.id] ?? "power-up",
              1,
              nodeState(tier1A.id, level, tier1A.unlockLevel, unlocked, available),
            )}
          {tier1B &&
            renderNode(
              tier1B.id,
              tier1B.nameZh,
              tier1B.description,
              SKILL_TREE_ICON[tier1B.id] ?? "power-up",
              1,
              nodeState(tier1B.id, level, tier1B.unlockLevel, unlocked, available),
            )}
        </div>

        {/* 连接线 */}
        <div className="flex w-full max-w-sm justify-between px-16">
          <div className="h-4 w-0.5 bg-rpg-15" />
          <div className="h-4 w-0.5 bg-rpg-15" />
        </div>

        {/* Tier 2 */}
        <div className="flex w-full max-w-sm justify-between gap-4 px-2">
          {tier2A &&
            renderNode(
              tier2A.id,
              tier2A.nameZh,
              tier2A.description,
              SKILL_TREE_ICON[tier2A.id] ?? "power-up",
              2,
              chosen === "b" && !unlocked.has(tier2A.id)
                ? "locked"
                : nodeState(tier2A.id, level, tier2A.unlockLevel, unlocked, available),
            )}
          {tier2B &&
            renderNode(
              tier2B.id,
              tier2B.nameZh,
              tier2B.description,
              SKILL_TREE_ICON[tier2B.id] ?? "power-up",
              2,
              chosen === "a" && !unlocked.has(tier2B.id)
                ? "locked"
                : nodeState(tier2B.id, level, tier2B.unlockLevel, unlocked, available),
            )}
        </div>
      </div>
    </PixelPanel>
  );
}
