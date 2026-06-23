"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStage, getNextStage, isStageUnlocked } from "~/data/stages";
import { getBattleSkills } from "~/data/skills";
import { getAggregatedModifiers, getEffectiveMaxHp } from "~/data/skillTree";
import { getHeroClass, getStyleForClass } from "~/data/classes";
import {
  CAST_CRIT_THRESHOLD,
  damageFromAccuracy,
  powerScaleFromAccuracy,
} from "~/lib/match";
import { speak } from "~/lib/tts";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { useGameStore } from "~/store/game";
import { DialogueBox } from "~/components/battle/DialogueBox";
import { CastPanel } from "~/components/battle/CastPanel";
import { PageShell } from "~/components/game/PageShell";
import { SkillFxOverlay } from "~/components/battle/SkillFxOverlay";
import { HpBar } from "~/components/pixel/HpBar";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import type { CastPhase, CastResult } from "~/hooks/useSpeechCast";
import type { SpriteAnimState } from "~/types/sprites";
import {
  getEnemyName,
  getSkillDisplayName,
  getSpeechStyleName,
  getStageIntro,
  getStageTitle,
  getVocabMeaning,
  heroName,
  formatMessage,
  messages,
  t,
} from "~/i18n";

type Phase = "intro" | "learn" | "battle" | "win" | "lose";

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
  const completeStage = useGameStore((s) => s.completeStage);
  const hasPendingSkillPick = useGameStore((s) => s.hasPendingSkillPick);

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
    () => getBattleSkills(stageId, classId, skillTreeUnlocked),
    [stageId, classId, skillTreeUnlocked],
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [enemyHp, setEnemyHp] = useState(0);
  const [heroHp, setHeroHp] = useState(0);
  const [skillIndex, setSkillIndex] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [enemyAnim, setEnemyAnim] = useState("");
  const [heroAnim, setHeroAnim] = useState("");
  const [heroSprite, setHeroSprite] = useState<SpriteAnimState>("idle");
  const [enemySprite, setEnemySprite] = useState<SpriteAnimState>("idle");
  const [floats, setFloats] = useState<FloatDmg[]>([]);
  const [fxTrigger, setFxTrigger] = useState(0);
  const floatId = useRef(0);

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
    if (stage && hero) {
      setEnemyHp(stage.enemy.hp);
      setHeroHp(maxHeroHp);
    }
  }, [stage, hero, maxHeroHp]);

  const currentSkill = skills.length > 0 ? skills[skillIndex % skills.length] : undefined;
  const vocabIds = useMemo(() => stage?.vocab.map((v) => v.id) ?? [], [stage]);

  if (!ready || !stage || !hero) {
    return (
      <PageShell>
        <p className="font-pixel text-xs text-rpg-12">{t(messages.common.loading, locale)}</p>
      </PageShell>
    );
  }

  const heroLabel = heroName(hero.id, locale);
  const enemyLabel = getEnemyName(stage, locale);
  const stageTitle = getStageTitle(stage, locale);
  const styleLabel = getSpeechStyleName(style, locale);

  const pushFloat = (amount: number, crit: boolean) => {
    const id = ++floatId.current;
    setFloats((prev) => [...prev, { id, amount, crit }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 900);
  };

  const performEnemyAttack = (
    multiplier: number,
    reason: string,
    onComplete: () => void,
  ) => {
    const reduction = skillMods.failDamageReduction ?? 0;
    const raw = stage.enemy.attack * multiplier;
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

    const { damage, crit, cast } = damageFromAccuracy(
      result.accuracy,
      currentSkill.baseDamage,
      hero.stats.power,
      critThreshold,
    );

    if (cast && damage > 0) {
      setHeroSprite("attack");
      setEnemySprite("hurt");
      setFxTrigger((k) => k + 1);
      const nextEnemyHp = Math.max(0, enemyHp - damage);
      setEnemyAnim("anim-shake anim-flash");
      pushFloat(damage, crit);
      const powerPct = Math.round(powerScaleFromAccuracy(result.accuracy) * 100);
      const powerNote =
        result.accuracy < critThreshold && result.accuracy > 0
          ? formatMessage(t(messages.battle.powerNote, locale), { pct: powerPct })
          : "";
      const skillName = getSkillDisplayName(currentSkill, locale);
      setFeedback(
        formatMessage(
          t(crit ? messages.battle.critDamage : messages.battle.normalDamage, locale),
          { skill: skillName, damage, power: powerNote },
        ),
      );
      setEnemyHp(nextEnemyHp);

      setTimeout(() => {
        setEnemyAnim("");
        setHeroSprite("idle");
        if (nextEnemyHp <= 0) {
          setEnemySprite("death");
          completeStage(stage.id, vocabIds);
          setPhase("win");
          setBusy(false);
        } else {
          performEnemyAttack(1, "", () => {
            setSkillIndex((i) => (i + 1) % skills.length);
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
    setEnemyHp(stage.enemy.hp);
    setHeroHp(maxHeroHp);
    setSkillIndex(0);
    setAttemptKey((k) => k + 1);
    setFeedback("");
    setHeroSprite("idle");
    setEnemySprite("idle");
    setPhase("battle");
  };

  const handleCastPhase = (castPhase: CastPhase) => {
    if (busy) return;
    if (castPhase === "listening") setHeroSprite("cast");
    else if (castPhase === "idle" || castPhase === "scored") {
      setHeroSprite((s) => (s === "cast" ? "idle" : s));
    }
  };

  const winSkillHint = hasPendingSkillPick() ? t(messages.battle.skillHint, locale) : "";

  return (
    <PageShell className="gap-4 sm:gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-pixel text-xs text-rpg-5 sm:text-sm">{stageTitle}</h1>
        <span className="font-jp text-[11px] text-rpg-14 sm:text-xs">
          {heroLabel}·{styleLabel}
        </span>
      </header>

      {phase === "intro" && (
        <DialogueBox
          speaker={t(messages.battle.narrator, locale)}
          sprite="📜"
          text={getStageIntro(stage, locale)}
          onNext={() => setPhase("learn")}
          nextLabel={t(messages.battle.learnVocab, locale)}
        />
      )}

      {phase === "learn" && (
        <div className="flex flex-col gap-4">
          <PixelPanel tone="dialog">
            <p className="font-pixel text-[11px] text-rpg-5">{t(messages.battle.vocabTitle, locale)}</p>
            <p className="mt-1 font-jp text-xs text-rpg-14">
              {t(messages.battle.vocabHint, locale)}
            </p>
          </PixelPanel>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {stage.vocab.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => speak(v.ttsText ?? v.kana)}
                className="text-left"
              >
                <PixelPanel className="h-full">
                  <p className="font-jp text-base text-rpg-5">
                    {v.kanji ?? v.kana}
                  </p>
                  <p className="font-jp text-xs text-rpg-12">{v.kana}</p>
                  <p className="font-jp text-xs text-rpg-14">
                    {getVocabMeaning(v.id, v.zh, locale)}
                  </p>
                  <p className="mt-1 font-pixel text-[9px] text-rpg-11">
                    {t(messages.battle.pronounce, locale)}
                  </p>
                </PixelPanel>
              </button>
            ))}
          </div>
          <PixelButton variant="gold" className="w-full sm:w-auto" onClick={() => setPhase("battle")}>
            {t(messages.battle.startBattle, locale)}
          </PixelButton>
        </div>
      )}

      {phase === "battle" && currentSkill && (
        <div className="flex flex-col gap-4">
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
                  id={stage.enemy.spriteKey}
                  fallbackGlyph={stage.enemy.sprite}
                  state={enemySprite}
                  playing
                  bob={enemySprite === "idle" && !busy}
                  label={enemyLabel}
                />
                <SkillFxOverlay fxKey={currentSkill.fxKey} triggerKey={fxTrigger} />
              </div>
              <div className="w-[4.75rem] sm:w-28">
                <HpBar
                  current={enemyHp}
                  max={stage.enemy.hp}
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

          {feedback && (
            <p className="text-center font-jp text-xs text-rpg-12">{feedback}</p>
          )}

          <CastPanel
            skill={currentSkill}
            classId={hero.id}
            locale={locale}
            attemptKey={attemptKey}
            onResolved={handleResolved}
            busy={busy}
            onCastPhaseChange={handleCastPhase}
          />
        </div>
      )}

      {phase === "win" && (
        <div className="flex flex-col gap-4">
          <DialogueBox
            speaker={t(messages.battle.winSpeaker, locale)}
            sprite="🏆"
            text={formatMessage(t(messages.battle.winText, locale), {
              enemy: enemyLabel,
              skillHint: winSkillHint,
            })}
          />
          <div className="flex flex-col gap-3">
            {getNextStage(stage.id) ? (
              <PixelButton
                variant="gold"
                className="w-full sm:w-auto"
                onClick={() => router.push(`/battle/${getNextStage(stage.id)!.id}`)}
              >
                {t(messages.battle.nextStage, locale)}
              </PixelButton>
            ) : (
              <PixelPanel tone="dialog">
                <p className="font-jp text-sm text-rpg-5">
                  {t(messages.battle.allCleared, locale)}
                </p>
              </PixelPanel>
            )}
            <PixelButton className="w-full sm:w-auto" onClick={() => router.push("/adventure")}>
              {t(messages.battle.backToMap, locale)}
            </PixelButton>
          </div>
        </div>
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
