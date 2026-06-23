"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STAGES_ORDERED, isStageUnlocked } from "~/data/stages";
import { getHeroClass, getStyleForClass } from "~/data/classes";
import { getChosenBranch, getAvailableSkillPicks, SKILL_TREES } from "~/data/skillTree";
import { SKILL_TREE_ICON } from "~/data/skillIcons";
import { MapNode } from "~/components/game/MapNode";
import { SkillTreeModal } from "~/components/game/SkillTreeModal";
import { SkillTreeView } from "~/components/game/SkillTreeView";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { useGameReady } from "~/hooks/useGameReady";
import { useGameStore } from "~/store/game";

export default function AdventurePage() {
  const router = useRouter();
  const ready = useGameReady();
  const classId = useGameStore((s) => s.classId);
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const clearedStageIds = useGameStore((s) => s.clearedStageIds);
  const skillTreeUnlocked = useGameStore((s) => s.skillTreeUnlocked);
  const unlockSkillNode = useGameStore((s) => s.unlockSkillNode);
  const hasPendingSkillPick = useGameStore((s) => s.hasPendingSkillPick);

  const [showSkillTree, setShowSkillTree] = useState(false);

  const hero = getHeroClass(classId);
  const style = getStyleForClass(classId);
  const branch = classId ? getChosenBranch(classId, skillTreeUnlocked) : null;

  useEffect(() => {
    if (ready && !classId) router.replace("/select");
  }, [ready, classId, router]);

  useEffect(() => {
    if (ready && hasPendingSkillPick()) {
      setShowSkillTree(true);
    }
  }, [ready, level, skillTreeUnlocked, hasPendingSkillPick]);

  if (!ready || !hero || !classId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-pixel text-xs text-rpg-12">加载中…</p>
      </main>
    );
  }

  const unlockedNodes = (SKILL_TREES[classId] ?? []).filter((n) =>
    skillTreeUnlocked.includes(n.id),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      {showSkillTree && (
        <SkillTreeModal
          classId={classId}
          level={level}
          unlockedIds={skillTreeUnlocked}
          onPick={(nodeId) => {
            unlockSkillNode(nodeId);
            const nextUnlocked = [...skillTreeUnlocked, nodeId];
            if (
              getAvailableSkillPicks(classId, level, nextUnlocked).length === 0
            ) {
              setShowSkillTree(false);
            }
          }}
          onClose={() => setShowSkillTree(false)}
        />
      )}

      <PixelPanel tone="dialog" className="flex items-center gap-4">
        <CharacterSprite
          kind="hero"
          id={hero.spriteKey}
          fallbackGlyph={hero.sprite}
          state="idle"
          bob
          label={hero.nameZh}
        />
        <div className="flex-1">
          <p className="font-pixel text-sm text-rpg-5">
            {hero.nameZh} · Lv.{level}
          </p>
          <p className="font-jp text-xs text-rpg-12">
            语体：{style.nameZh}（{style.nameJa}）
          </p>
          <p className="font-pixel text-[10px] text-rpg-14">EXP {exp}</p>
          {branch && (
            <p className="font-jp text-[10px] text-rpg-11">
              技能路线：分支 {branch.toUpperCase()}
            </p>
          )}
        </div>
        {hasPendingSkillPick() && (
          <PixelButton variant="gold" onClick={() => setShowSkillTree(true)}>
            技能+
          </PixelButton>
        )}
      </PixelPanel>

      {unlockedNodes.length > 0 && (
        <PixelPanel>
          <p className="font-pixel text-[10px] text-rpg-5">已解锁技能</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {unlockedNodes.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                <SkillIcon
                  iconKey={SKILL_TREE_ICON[n.id] ?? "power-up"}
                  size={28}
                  title={n.nameZh}
                />
                <span className="font-jp text-xs text-rpg-12">
                  {n.nameZh} — {n.description}
                </span>
              </li>
            ))}
          </ul>
        </PixelPanel>
      )}

      <SkillTreeView
        classId={classId}
        level={level}
        unlockedIds={skillTreeUnlocked}
        onPick={hasPendingSkillPick() ? unlockSkillNode : undefined}
      />

      <header className="text-center">
        <h1 className="font-pixel text-lg text-rpg-5">冒险地图</h1>
        <p className="mt-1 font-jp text-xs text-rpg-14">选择关卡，开始讨伐！</p>
      </header>

      <div className="flex flex-col gap-4">
        {STAGES_ORDERED.map((stage) => (
          <MapNode
            key={stage.id}
            stage={stage}
            unlocked={isStageUnlocked(stage.id, clearedStageIds)}
            cleared={clearedStageIds.includes(stage.id)}
            onEnter={(id) => router.push(`/battle/${id}`)}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <PixelButton onClick={() => router.push("/")}>← 返回标题</PixelButton>
      </div>
    </main>
  );
}
