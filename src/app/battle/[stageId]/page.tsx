"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStage, getNextStage, getEncounter, isStageUnlocked } from "~/data/stages";
import { getBattleSkills } from "~/data/skills";
import { getAggregatedModifiers, getEffectiveMaxHp } from "~/data/skillTree";
import { getHeroClass, getStyleForClass } from "~/data/classes";
import {
  CAST_CRIT_THRESHOLD,
  damageFromAccuracy,
  powerScaleFromAccuracy,
} from "~/lib/match";
import { getElementMatchup } from "~/lib/element";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { useGameStore } from "~/store/game";
import { DialogueBox } from "~/components/battle/DialogueBox";
import { CastPanel } from "~/components/battle/CastPanel";
import { ElementBadge, SkillBar } from "~/components/battle/ElementBadge";
import { BattleResultPanel } from "~/components/battle/BattleResultPanel";
import { PageShell } from "~/components/game/PageShell";
import { SkillFxOverlay } from "~/components/battle/SkillFxOverlay";
import { HpBar } from "~/components/pixel/HpBar";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import type { CastPhase, CastResult } from "~/hooks/useSpeechCast";
import type { SpriteAnimState } from "~/types/sprites";
import type { Skill, StageClearResult } from "~/types";
import {
  getEncounterName,
  getSkillDisplayName,
  getSpeechStyleName,
  getStageIntro,
  getStageTitle,
  heroName,
  formatMessage,
  messages,
  t,
} from "~/i18n";

type Phase = "intro" | "battle" | "result" | "lose";

interface FloatDmg {
  id: number;
  amount: number;
  crit: boolean;
}

export default function BattlePage() {
  const router = useRouter();
  const params = useParams<{ stageId: string }>();
  const stageId = params?.stageId ?? "";
  const { locale } = useLocale();

  const ready = useGameReady();
  const classId = useGameStore((s) => s.classId);
  const clearedStageIds = useGameStore((s) => s.clearedStageIds);
  const skillTreeUnlocked = useGameStore((s) => s.skillTreeUnlocked);
  const unlockedSkillIds = useGameStore((s) => s.unlockedSkillIds);
  const completeStage = useGameStore((s) => s.completeStage);
  const discoverEncounter = useGameStore((s) => s.discoverEncounter);
  const autosave = useGameStore((s) => s.autosave);

  const stage = getStage(stageId);
  const hero = getHeroClass(classId);
  const style = getStyleForClass(classId);

  const skillMods = useMemo(
    () => (hero ? getAggregatedModifiers(hero.id, skillTreeUnlocked) : {}),
    [hero, skillTreeUnlocked],
  );
  const maxHeroHp = useMemo(
    () => (hero ? getEffectiveMaxHp(hero.stats.maxHp, hero.id, skillTreeUnlocked) : 0),
    [hero, skillTreeUnlocked],
  );
  const critThreshold = CAST_CRIT_THRESHOLD - (skillMods.critBonus ?? 0);

  const skills = useMemo(
    () => getBattleSkills(classId, unlockedSkillIds, skillTreeUnlocked),
    [classId, unlockedSkillIds, skillTreeUnlocked],
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [encounterIndex, setEncounterIndex] = useState(0);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [enemyHp, setEnemyHp] = useState(0);
  const [heroHp, setHeroHp] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [enemyAnim, setEnemyAnim] = useState("");
  const [heroAnim, setHeroAnim] = useState("");
  const [heroSprite, setHeroSprite] = useState<SpriteAnimState>("idle");
  const [enemySprite, setEnemySprite] = useState<SpriteAnimState>("idle");
  const [floats, setFloats] = useState<FloatDmg[]>([]);
  const [fxTrigger, setFxTrigger] = useState(0);
  const [clearResult, setClearResult] = useState<StageClearResult | null>(null);
  const floatId = useRef(0);

  const encounter = stage ? getEncounter(stage, encounterIndex) : undefined;
  const enemy = encounter?.enemy;
  const totalEncounters = stage?.encounters.length ?? 0;
  const isBoss = encounter?.kind === "boss";

  const currentSkill: Skill | undefined = useMemo(() => {
    if (!selectedSkillId) return undefined;
    return skills.find((s) => s.id === selectedSkillId);
  }, [skills, selectedSkillId]);

  useEffect(() => {
    if (!ready) return;
    if (!classId) {
      router.replace("/select");
      return;
    }
    if (!stage) {
      router.replace("/adventure");
      return;
    }
    if (!isStageUnlocked(stage.id, clearedStageIds)) {
      router.replace("/adventure");
    }
  }, [ready, classId, stage, clearedStageIds, router]);

  useEffect(() => {
    if (encounter?.id) {
      discoverEncounter(encounter.id);
    }
  }, [encounter?.id, discoverEncounter]);

  useEffect(() => {
    if (enemy && hero) {
      setEnemyHp(enemy.hp);
      setEnemySprite("idle");
    }
  }, [encounterIndex, enemy, hero]);

  useEffect(() => {
    if (stage && hero && skills.length > 0) {
      setHeroHp(maxHeroHp);
      setSelectedSkillId((prev) =>
        prev && skills.some((s) => s.id === prev) ? prev : skills[0]!.id,
      );
    }
  }, [stage?.id, hero, maxHeroHp, skills]);

  if (!ready || !stage || !hero || !enemy || !encounter) {
    return (
      <PageShell>
        <p className="font-pixel text-xs text-rpg-12">{t(messages.common.loading, locale)}</p>
      </PageShell>
    );
  }

  const heroLabel = heroName(hero.id, locale);
  const enemyLabel = getEncounterName(encounter.id, enemy.name, locale);
  const stageTitle = getStageTitle(stage, locale);
  const styleLabel = getSpeechStyleName(style, locale);
  const bossLabel = getEncounterName(
    stage.encounters[stage.encounters.length - 1]?.id ?? "",
    stage.encounters[stage.encounters.length - 1]?.enemy.name ?? "",
    locale,
  );
  const nextStage = getNextStage(stage.id);

  const pushFloat = (amount: number, crit: boolean) => {
    const id = ++floatId.current;
    setFloats((prev) => [...prev, { id, amount, crit }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 900);
  };

  const advanceEncounter = () => {
    const nextIndex = encounterIndex + 1;
    const next = getEncounter(stage, nextIndex);
    if (!next) return;

    setEncounterIndex(nextIndex);
    setEnemyHp(next.enemy.hp);
    setEnemySprite("idle");
    setEnemyAnim("");
    setFloats([]);
    setAttemptKey((k) => k + 1);
    setFeedback(
      next.kind === "boss"
        ? t(messages.battle.bossApproach, locale)
        : t(messages.battle.nextEncounter, locale),
    );
  };

  const performEnemyAttack = (
    multiplier: number,
    reason: string,
    onComplete: () => void,
  ) => {
    const reduction = skillMods.failDamageReduction ?? 0;
    const raw = enemy.attack * multiplier;
    const dmg = Math.max(1, Math.round(raw * (1 - reduction)));

    setEnemySprite("attack");
    setHeroSprite("hurt");
    setHeroAnim("anim-shake");
    setFeedback(
      formatMessage(t(messages.battle.enemyAttack, locale), {
        reason,
        enemy: enemyLabel,
        dmg,
      }),
    );

    setHeroHp((prev) => {
      const next = Math.max(0, prev - dmg);
      setTimeout(() => {
        setHeroAnim("");
        setHeroSprite("idle");
        setEnemySprite("idle");
        if (next <= 0) {
          setPhase("lose");
        } else {
          onComplete();
        }
        setBusy(false);
      }, 650);
      return next;
    });
  };

  const handleResolved = (result: CastResult) => {
    if (busy || !currentSkill) return;
    setBusy(true);

    const skillEl = currentSkill.element ?? "neutral";
    const matchup = getElementMatchup(skillEl, enemy);

    const { damage: baseDmg, crit, cast } = damageFromAccuracy(
      result.accuracy,
      currentSkill.baseDamage,
      hero.stats.power,
      critThreshold,
    );

    const damage = Math.max(0, Math.round(baseDmg * matchup.multiplier));

    if (cast && damage > 0) {
      setHeroSprite("attack");
      setEnemySprite("hurt");
      setFxTrigger((k) => k + 1);
      const nextEnemyHp = Math.max(0, enemyHp - damage);
      setEnemyAnim("anim-shake anim-flash");
      pushFloat(damage, crit || matchup.result === "super");
      const powerPct = Math.round(powerScaleFromAccuracy(result.accuracy) * 100);
      const powerNote =
        result.accuracy < critThreshold && result.accuracy > 0
          ? formatMessage(t(messages.battle.powerNote, locale), { pct: powerPct })
          : "";
      const elementNote =
        matchup.result === "super"
          ? t(messages.battle.elementNoteSuper, locale)
          : matchup.result === "weak"
            ? t(messages.battle.elementNoteWeak, locale)
            : "";
      const skillName = getSkillDisplayName(currentSkill, locale);
      setFeedback(
        formatMessage(
          t(crit ? messages.battle.critDamage : messages.battle.normalDamage, locale),
          { skill: skillName, damage, power: `${powerNote}${elementNote}` },
        ),
      );
      setEnemyHp(nextEnemyHp);

      setTimeout(() => {
        setEnemyAnim("");
        setHeroSprite("idle");
        if (nextEnemyHp <= 0) {
          if (encounterIndex >= totalEncounters - 1) {
            setEnemySprite("death");
            const resultSnapshot = completeStage(stage.id);
            setClearResult(resultSnapshot);
            setPhase("result");
            setBusy(false);
          } else {
            setEnemySprite("death");
            setTimeout(() => {
              advanceEncounter();
              autosave();
              setBusy(false);
            }, 500);
          }
        } else {
          performEnemyAttack(1, "", () => {
            setAttemptKey((k) => k + 1);
          });
        }
      }, 650);
    } else {
      performEnemyAttack(1.2, t(messages.battle.castFail, locale), () => {
        setAttemptKey((k) => k + 1);
      });
    }
  };

  const restartBattle = () => {
    setEncounterIndex(0);
    setEnemyHp(stage.encounters[0]?.enemy.hp ?? enemy.hp);
    setHeroHp(maxHeroHp);
    setSelectedSkillId(skills[0]?.id ?? null);
    setAttemptKey((k) => k + 1);
    setFeedback("");
    setHeroSprite("idle");
    setEnemySprite("idle");
    setClearResult(null);
    setPhase("battle");
  };

  const handleCastPhase = (castPhase: CastPhase) => {
    if (busy) return;
    if (castPhase === "listening") setHeroSprite("cast");
    else if (castPhase === "idle" || castPhase === "scored") {
      setHeroSprite((s) => (s === "cast" ? "idle" : s));
    }
  };

  return (
    <PageShell className="gap-4 sm:gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-pixel text-xs text-rpg-5 sm:text-sm">{stageTitle}</h1>
          {phase === "battle" && (
            <p className="font-pixel text-[9px] text-rpg-14 sm:text-[10px]">
              {formatMessage(t(messages.battle.encounterProgress, locale), {
                current: encounterIndex + 1,
                total: totalEncounters,
              })}
            </p>
          )}
        </div>
        <span className="font-jp text-[11px] text-rpg-14 sm:text-xs">
          {heroLabel}·{styleLabel}
        </span>
      </header>

      {phase === "intro" && (
        <div className="flex flex-col gap-4">
          <DialogueBox
            speaker={t(messages.battle.narrator, locale)}
            sprite="📜"
            text={getStageIntro(stage, locale)}
            onNext={() => setPhase("battle")}
            nextLabel={t(messages.battle.startBattle, locale)}
          />
          <PixelPanel>
            <p className="font-pixel text-[11px] text-rpg-5">
              {t(messages.battle.elementGuideTitle, locale)}
            </p>
            <p className="mt-1 font-jp text-xs leading-relaxed text-rpg-14">
              {t(messages.battle.elementGuideHint, locale)}
            </p>
          </PixelPanel>
        </div>
      )}

      {phase === "battle" && (
        <div className="flex flex-col gap-4">
          {skills.length === 0 ? (
            <PixelPanel tone="dialog">
              <p className="font-jp text-sm text-rpg-5">
                {t(messages.battle.noSkillsUnlocked, locale)}
              </p>
              <PixelButton className="mt-3" onClick={() => router.push("/adventure")}>
                {t(messages.battle.backToMap, locale)}
              </PixelButton>
            </PixelPanel>
          ) : (
            <>
              <PixelPanel
                tone="dialog"
                className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-0.5 px-2 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5"
              >
                <div className="flex min-w-0 flex-col items-center gap-1 sm:gap-2">
                  <div className={`origin-bottom scale-[0.72] sm:scale-100 ${heroAnim}`}>
                    <CharacterSprite
                      kind="hero"
                      id={hero.spriteKey}
                      fallbackGlyph={hero.sprite}
                      state={heroSprite}
                      playing={!busy || heroSprite === "cast"}
                      bob={heroSprite === "idle" && !busy}
                      label={heroLabel}
                    />
                  </div>
                  <div className="w-[4.75rem] sm:w-28">
                    <HpBar current={heroHp} max={maxHeroHp} tone="hero" locale={locale} />
                  </div>
                </div>

                <span className="font-pixel self-center pb-8 text-[10px] text-rpg-4 sm:pb-0 sm:text-xs">
                  {t(messages.common.vs, locale)}
                </span>

                <div className="relative flex min-w-0 flex-col items-center gap-1 sm:gap-2">
                  <div className={`relative origin-bottom scale-[0.72] sm:scale-100 ${enemyAnim}`}>
                    <CharacterSprite
                      kind="enemy"
                      id={enemy.spriteKey}
                      fallbackGlyph={enemy.sprite}
                      state={enemySprite}
                      playing
                      bob={enemySprite === "idle" && !busy}
                      label={enemyLabel}
                    />
                    {currentSkill && (
                      <SkillFxOverlay fxKey={currentSkill.fxKey} triggerKey={fxTrigger} />
                    )}
                  </div>
                  <div className="w-[4.75rem] sm:w-28">
                    <HpBar
                      current={enemyHp}
                      max={enemy.hp}
                      tone="enemy"
                      label={enemyLabel}
                      locale={locale}
                      compactLabel
                    />
                  </div>
                  <div className="pointer-events-none absolute -top-2 right-0">
                    {floats.map((f) => (
                      <span
                        key={f.id}
                        className={`anim-float-up absolute right-0 font-pixel ${
                          f.crit ? "text-rpg-5" : "text-rpg-4"
                        }`}
                      >
                        -{f.amount}
                        {f.crit ? "!!" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </PixelPanel>

              <ElementBadge
                enemy={enemy}
                locale={locale}
                isBoss={isBoss}
                className="text-center sm:text-left"
              />

              {feedback && (
                <p className="text-center font-jp text-xs text-rpg-12">{feedback}</p>
              )}

              <SkillBar
                skills={skills}
                selectedId={selectedSkillId}
                enemy={enemy}
                locale={locale}
                disabled={busy}
                onSelect={setSelectedSkillId}
              />

              {currentSkill ? (
                <CastPanel
                  skill={currentSkill}
                  classId={hero.id}
                  locale={locale}
                  attemptKey={attemptKey}
                  onResolved={handleResolved}
                  busy={busy}
                  onCastPhaseChange={handleCastPhase}
                />
              ) : (
                <PixelPanel>
                  <p className="text-center font-jp text-sm text-rpg-14">
                    {t(messages.battle.selectSkillFirst, locale)}
                  </p>
                </PixelPanel>
              )}
            </>
          )}
        </div>
      )}

      {phase === "result" && clearResult && (
        <BattleResultPanel
          classId={hero.id}
          locale={locale}
          bossLabel={bossLabel}
          clearResult={clearResult}
          hasNextStage={Boolean(nextStage)}
          onNextStage={() => nextStage && router.push(`/battle/${nextStage.id}`)}
          onBackToMap={() => router.push("/adventure")}
        />
      )}

      {phase === "lose" && (
        <div className="flex flex-col gap-4">
          <DialogueBox
            speaker={t(messages.battle.loseSpeaker, locale)}
            sprite="💀"
            text={formatMessage(t(messages.battle.loseText, locale), { enemy: enemyLabel })}
          />
          <PixelButton variant="gold" className="w-full sm:w-auto" onClick={restartBattle}>
            {t(messages.battle.retry, locale)}
          </PixelButton>
          <PixelButton className="w-full sm:w-auto" onClick={() => router.push("/adventure")}>
            {t(messages.battle.backToMap, locale)}
          </PixelButton>
        </div>
      )}
    </PageShell>
  );
}
