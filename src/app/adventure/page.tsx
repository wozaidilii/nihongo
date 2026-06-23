"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STAGES_ORDERED, isStageUnlocked } from "~/data/stages";
import { getHeroClass, getStyleForClass } from "~/data/classes";
import { getChosenBranch, getAvailableSkillPicks, SKILL_TREES } from "~/data/skillTree";
import { getBattleSkills } from "~/data/skills";
import { SKILL_TREE_ICON, iconKeyForSkill } from "~/data/skillIcons";
import { MapNode } from "~/components/game/MapNode";
import { PageShell } from "~/components/game/PageShell";
import { SkillTreeModal } from "~/components/game/SkillTreeModal";
import { SkillUnlockModal } from "~/components/game/SkillUnlockModal";
import { SkillTreeView } from "~/components/game/SkillTreeView";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { useGameStore } from "~/store/game";
import {
  getSkillTreeNodeDesc,
  getSkillTreeNodeName,
  getSkillDisplayName,
  getSpeechStyleName,
  heroName,
  formatMessage,
  messages,
  t,
} from "~/i18n";

export default function AdventurePage() {
  const router = useRouter();
  const ready = useGameReady();
  const { locale } = useLocale();
  const classId = useGameStore((s) => s.classId);
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const clearedStageIds = useGameStore((s) => s.clearedStageIds);
  const skillTreeUnlocked = useGameStore((s) => s.skillTreeUnlocked);
  const unlockedSkillIds = useGameStore((s) => s.unlockedSkillIds);
  const unlockSkillNode = useGameStore((s) => s.unlockSkillNode);
  const hasPendingSkillPick = useGameStore((s) => s.hasPendingSkillPick);
  const hasPendingBattleSkillUnlock = useGameStore((s) => s.hasPendingBattleSkillUnlock);

  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showSkillUnlock, setShowSkillUnlock] = useState(false);

  const hero = getHeroClass(classId);
  const style = getStyleForClass(classId);
  const branch = classId ? getChosenBranch(classId, skillTreeUnlocked) : null;

  useEffect(() => {
    if (ready && !classId) router.replace("/select");
  }, [ready, classId, router]);

  useEffect(() => {
    if (ready && hasPendingBattleSkillUnlock()) {
      setShowSkillUnlock(true);
    }
  }, [ready, level, unlockedSkillIds, hasPendingBattleSkillUnlock]);

  useEffect(() => {
    if (ready && hasPendingSkillPick()) {
      setShowSkillTree(true);
    }
  }, [ready, level, skillTreeUnlocked, hasPendingSkillPick]);

  if (!ready || !hero || !classId) {
    return (
      <PageShell>
        <p className="font-pixel text-xs text-rpg-12">{t(messages.common.loading, locale)}</p>
      </PageShell>
    );
  }

  const unlockedNodes = (SKILL_TREES[classId] ?? []).filter((n) =>
    skillTreeUnlocked.includes(n.id),
  );
  const battleSkills = getBattleSkills(classId, unlockedSkillIds, skillTreeUnlocked);
  const heroLabel = heroName(hero.id, locale);

  return (
    <PageShell>
      {showSkillUnlock && (
        <SkillUnlockModal
          classId={classId}
          locale={locale}
          onClose={() => setShowSkillUnlock(false)}
        />
      )}

      {showSkillTree && (
        <SkillTreeModal
          classId={classId}
          level={level}
          locale={locale}
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

      <PixelPanel tone="dialog" className="flex flex-wrap items-center gap-3 sm:gap-4">
        <CharacterSprite
          kind="hero"
          id={hero.spriteKey}
          fallbackGlyph={hero.sprite}
          state="idle"
          bob
          label={heroLabel}
        />
        <div className="flex-1">
          <p className="font-pixel text-sm text-rpg-5">
            {heroLabel} · Lv.{level}
          </p>
          <p className="font-jp text-xs text-rpg-12">
            {t(messages.common.speechStyle, locale)}：{getSpeechStyleName(style, locale)}
            （{style.nameJa}）
          </p>
          <p className="font-pixel text-[10px] text-rpg-14">
            {t(messages.common.exp, locale)} {exp}
          </p>
          {branch && (
            <p className="font-jp text-[10px] text-rpg-11">
              {formatMessage(t(messages.adventure.skillRoute, locale), {
                branch: branch.toUpperCase(),
              })}
            </p>
          )}
        </div>
        {hasPendingBattleSkillUnlock() && (
          <PixelButton
            variant="gold"
            className="w-full shrink-0 sm:ml-auto sm:w-auto"
            onClick={() => setShowSkillUnlock(true)}
          >
            {t(messages.adventure.unlockSpell, locale)}
          </PixelButton>
        )}
        {hasPendingSkillPick() && (
          <PixelButton
            variant="gold"
            className="w-full shrink-0 sm:ml-auto sm:w-auto"
            onClick={() => setShowSkillTree(true)}
          >
            {t(messages.adventure.skillPlus, locale)}
          </PixelButton>
        )}
      </PixelPanel>

      {battleSkills.length > 0 && (
        <PixelPanel>
          <p className="font-pixel text-[10px] text-rpg-5">
            {t(messages.adventure.unlockedSpells, locale)}
          </p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {battleSkills.map((skill) => (
              <li key={skill.id} className="flex items-center gap-2">
                <SkillIcon
                  iconKey={iconKeyForSkill(skill.fxKey)}
                  size={28}
                  title={getSkillDisplayName(skill, locale)}
                />
                <span className="font-jp text-xs text-rpg-12">
                  {getSkillDisplayName(skill, locale)}
                </span>
              </li>
            ))}
          </ul>
        </PixelPanel>
      )}

      {unlockedNodes.length > 0 && (
        <PixelPanel>
          <p className="font-pixel text-[10px] text-rpg-5">
            {t(messages.adventure.unlockedSkills, locale)}
          </p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {unlockedNodes.map((n) => (
              <li key={n.id} className="flex items-center gap-2">
                <SkillIcon
                  iconKey={SKILL_TREE_ICON[n.id] ?? "power-up"}
                  size={28}
                  title={getSkillTreeNodeName(n, locale)}
                />
                <span className="font-jp text-xs text-rpg-12">
                  {getSkillTreeNodeName(n, locale)} — {getSkillTreeNodeDesc(n, locale)}
                </span>
              </li>
            ))}
          </ul>
        </PixelPanel>
      )}

      <SkillTreeView
        classId={classId}
        level={level}
        locale={locale}
        unlockedIds={skillTreeUnlocked}
        onPick={hasPendingSkillPick() ? unlockSkillNode : undefined}
        compact
      />

      <header className="text-center">
        <h1 className="font-pixel text-lg text-rpg-5">{t(messages.adventure.mapTitle, locale)}</h1>
        <p className="mt-1 font-jp text-xs text-rpg-14">{t(messages.adventure.mapSubtitle, locale)}</p>
      </header>

      <div className="flex flex-col gap-4">
        {STAGES_ORDERED.map((stage) => (
          <MapNode
            key={stage.id}
            stage={stage}
            locale={locale}
            unlocked={isStageUnlocked(stage.id, clearedStageIds)}
            cleared={clearedStageIds.includes(stage.id)}
            onEnter={(id) => router.push(`/battle/${id}`)}
          />
        ))}
      </div>

      <div className="flex justify-center pb-2">
        <PixelButton className="w-full max-w-xs sm:w-auto" onClick={() => router.push("/")}>
          {t(messages.common.backToTitle, locale)}
        </PixelButton>
      </div>
    </PageShell>
  );
}
