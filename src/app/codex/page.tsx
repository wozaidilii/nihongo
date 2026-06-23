"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllCodexEncounters,
  getAllVocab,
  getUnlockedSkillDetails,
} from "~/data/codex";
import { getHeroClass } from "~/data/classes";
import { iconKeyForSkill } from "~/data/skillIcons";
import { PageShell } from "~/components/game/PageShell";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import { speak } from "~/lib/tts";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { useGameStore } from "~/store/game";
import type { Element } from "~/types";
import {
  getEncounterName,
  getElementLabel,
  getSkillDisplayName,
  getSkillMeaning,
  getVocabMeaning,
  heroName,
  messages,
  t,
} from "~/i18n";

type CodexTab = "vocab" | "spells" | "enemies";

export default function CodexPage() {
  const router = useRouter();
  const ready = useGameReady();
  const { locale } = useLocale();
  const classId = useGameStore((s) => s.classId);
  const level = useGameStore((s) => s.level);
  const learnedVocabIds = useGameStore((s) => s.learnedVocabIds);
  const unlockedSkillIds = useGameStore((s) => s.unlockedSkillIds);
  const discoveredEncounterIds = useGameStore((s) => s.discoveredEncounterIds);

  const [tab, setTab] = useState<CodexTab>("vocab");

  const hero = getHeroClass(classId);

  const vocabEntries = useMemo(() => {
    const all = getAllVocab();
    const learned = new Set(learnedVocabIds);
    return all.filter((v) => learned.has(v.id));
  }, [learnedVocabIds]);

  const spellEntries = useMemo(
    () => getUnlockedSkillDetails(classId, unlockedSkillIds),
    [classId, unlockedSkillIds],
  );

  const enemyEntries = useMemo(() => {
    const discovered = new Set(discoveredEncounterIds);
    return getAllCodexEncounters().filter((e) => discovered.has(e.encounterId));
  }, [discoveredEncounterIds]);

  if (!ready) {
    return (
      <PageShell>
        <p className="font-pixel text-xs text-rpg-12">{t(messages.common.loading, locale)}</p>
      </PageShell>
    );
  }

  const tabs: { id: CodexTab; label: string }[] = [
    { id: "vocab", label: t(messages.codex.tabVocab, locale) },
    { id: "spells", label: t(messages.codex.tabSpells, locale) },
    { id: "enemies", label: t(messages.codex.tabEnemies, locale) },
  ];

  return (
    <PageShell className="gap-4">
      <header className="text-center">
        <h1 className="font-pixel text-lg text-rpg-5">{t(messages.codex.title, locale)}</h1>
        <p className="mt-1 font-jp text-xs text-rpg-14">{t(messages.codex.subtitle, locale)}</p>
        {hero && (
          <p className="mt-1 font-jp text-[11px] text-rpg-12">
            {heroName(hero.id, locale)} · Lv.{level}
          </p>
        )}
      </header>

      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((item) => (
          <PixelButton
            key={item.id}
            variant={tab === item.id ? "gold" : "default"}
            className="text-[10px]"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </PixelButton>
        ))}
      </div>

      {tab === "vocab" && (
        <PixelPanel>
          {vocabEntries.length === 0 ? (
            <p className="font-jp text-sm text-rpg-14">{t(messages.codex.emptyVocab, locale)}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {vocabEntries.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className="w-full rounded border-2 border-rpg-15 bg-rpg-13/40 p-2 text-left hover:border-rpg-8"
                    onClick={() => speak(v.ttsText ?? v.kana)}
                  >
                    <p className="font-jp text-base text-rpg-5">{v.kanji ?? v.kana}</p>
                    <p className="font-jp text-xs text-rpg-12">{v.kana}</p>
                    <p className="font-jp text-[10px] text-rpg-14">
                      {getVocabMeaning(v.id, v.zh, locale)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PixelPanel>
      )}

      {tab === "spells" && (
        <PixelPanel>
          {!classId || spellEntries.length === 0 ? (
            <p className="font-jp text-sm text-rpg-14">{t(messages.codex.emptySpells, locale)}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {spellEntries.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-start gap-3 rounded border-2 border-rpg-15 bg-rpg-13/40 p-3"
                >
                  <SkillIcon
                    iconKey={iconKeyForSkill(skill.fxKey)}
                    size={32}
                    title={getSkillDisplayName(skill, locale)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-jp text-sm text-rpg-5">
                      {getSkillDisplayName(skill, locale)}
                    </p>
                    <p className="font-jp text-xs text-rpg-12">「{skill.incantation}」</p>
                    <p className="font-jp text-[10px] text-rpg-14">{skill.reading}</p>
                    <p className="mt-1 font-jp text-[10px] text-rpg-14">
                      {getElementLabel(skill.element ?? "neutral", locale)} ·{" "}
                      {getSkillMeaning(skill, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PixelPanel>
      )}

      {tab === "enemies" && (
        <PixelPanel>
          {enemyEntries.length === 0 ? (
            <p className="font-jp text-sm text-rpg-14">{t(messages.codex.emptyEnemies, locale)}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {enemyEntries.map((entry) => (
                <li
                  key={entry.encounterId}
                  className="flex items-center gap-3 rounded border-2 border-rpg-15 bg-rpg-13/40 p-3"
                >
                  <CharacterSprite
                    kind="enemy"
                    id={entry.spriteKey}
                    fallbackGlyph={entry.sprite}
                    state="idle"
                    bob={false}
                  />
                  <div>
                    <p className="font-jp text-sm text-rpg-5">
                      {getEncounterName(entry.encounterId, entry.enemyName, locale)}
                      {entry.kind === "boss" && (
                        <span className="ml-1 font-pixel text-[9px] text-rpg-3">BOSS</span>
                      )}
                    </p>
                    <p className="font-jp text-[10px] text-rpg-14">
                      {getElementLabel(entry.element as Element, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PixelPanel>
      )}

      <div className="flex justify-center gap-3 pb-2">
        <PixelButton onClick={() => router.push("/adventure")}>
          {t(messages.codex.backMap, locale)}
        </PixelButton>
        <PixelButton onClick={() => router.push("/")}>
          {t(messages.common.backToTitle, locale)}
        </PixelButton>
      </div>
    </PageShell>
  );
}
