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
import { useGameStore } from "~/store/game";
import { DialogueBox } from "~/components/battle/DialogueBox";
import { CastPanel } from "~/components/battle/CastPanel";
import { SkillFxOverlay } from "~/components/battle/SkillFxOverlay";
import { HpBar } from "~/components/pixel/HpBar";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import type { CastPhase, CastResult } from "~/hooks/useSpeechCast";
import type { SpriteAnimState } from "~/types/sprites";

type Phase = "intro" | "learn" | "battle" | "win" | "lose";

/** 一次性的浮动伤害数字 */
interface FloatDmg {
  id: number;
  amount: number;
  crit: boolean;
}

export default function BattlePage() {
  const router = useRouter();
  const params = useParams<{ stageId: string }>();
  const stageId = params?.stageId ?? "";

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

  // ----- 战斗状态 -----
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
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-pixel text-xs text-rpg-12">加载中…</p>
      </main>
    );
  }

  const pushFloat = (amount: number, crit: boolean) => {
    const id = ++floatId.current;
    setFloats((prev) => [...prev, { id, amount, crit }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 900);
  };

  /** 怪物攻击勇者（每回合或咏唱失败时） */
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
    setFeedback(`${reason}${stage.enemy.name} 攻击，受到 ${dmg} 点伤害！`);

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
          ? `（威力 ${powerPct}%）`
          : "";
      setFeedback(
        crit
          ? `暴击！「${currentSkill.nameZh}」造成 ${damage} 点伤害！${powerNote}`
          : `「${currentSkill.nameZh}」造成 ${damage} 点伤害！${powerNote}`,
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
          // 成功施法后怪物常规反击
          performEnemyAttack(1, "", () => {
            setSkillIndex((i) => (i + 1) % skills.length);
            setAttemptKey((k) => k + 1);
          });
        }
      }, 650);
    } else {
      // 咏唱失败：怪物强化反击
      performEnemyAttack(1.2, "咏唱失败！ ", () => {
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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-pixel text-sm text-rpg-5">{stage.title}</h1>
        <span className="font-jp text-xs text-rpg-14">
          {hero.nameZh}·{style.nameZh}
        </span>
      </header>

      {phase === "intro" && (
        <DialogueBox
          speaker="旁白"
          sprite="📜"
          text={stage.intro}
          onNext={() => setPhase("learn")}
          nextLabel="▶ 学习咒文词汇"
        />
      )}

      {phase === "learn" && (
        <div className="flex flex-col gap-4">
          <PixelPanel tone="dialog">
            <p className="font-pixel text-[11px] text-rpg-5">本关词汇</p>
            <p className="mt-1 font-jp text-xs text-rpg-14">
              点击单词可听发音，记住它们能帮你念好咒文！
            </p>
          </PixelPanel>
          <div className="grid grid-cols-2 gap-3">
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
                  <p className="font-jp text-xs text-rpg-14">{v.zh}</p>
                  <p className="mt-1 font-pixel text-[9px] text-rpg-11">🔊 发音</p>
                </PixelPanel>
              </button>
            ))}
          </div>
          <PixelButton variant="gold" onClick={() => setPhase("battle")}>
            ⚔️ 开始战斗！
          </PixelButton>
        </div>
      )}

      {phase === "battle" && currentSkill && (
        <div className="flex flex-col gap-4">
          <PixelPanel
            tone="dialog"
            className="relative flex items-center justify-between"
          >
            <div className="flex flex-col items-center gap-2">
              <div className={heroAnim}>
                <CharacterSprite
                  kind="hero"
                  id={hero.spriteKey}
                  fallbackGlyph={hero.sprite}
                  state={heroSprite}
                  playing={!busy || heroSprite === "cast"}
                  bob={heroSprite === "idle" && !busy}
                  label={hero.nameZh}
                />
              </div>
              <div className="w-28">
                <HpBar current={heroHp} max={maxHeroHp} tone="hero" />
              </div>
            </div>

            <span className="font-pixel text-xs text-rpg-4">VS</span>

            <div className="relative flex flex-col items-center gap-2">
              <div className={`relative ${enemyAnim}`}>
                <CharacterSprite
                  kind="enemy"
                  id={stage.enemy.spriteKey}
                  fallbackGlyph={stage.enemy.sprite}
                  state={enemySprite}
                  playing
                  bob={enemySprite === "idle" && !busy}
                  label={stage.enemy.name}
                />
                <SkillFxOverlay fxKey={currentSkill.fxKey} triggerKey={fxTrigger} />
              </div>
              <div className="w-28">
                <HpBar
                  current={enemyHp}
                  max={stage.enemy.hp}
                  tone="enemy"
                  label={stage.enemy.name}
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
            speaker="胜利！"
            sprite="🏆"
            text={`讨伐成功！${stage.enemy.name} 被你的中二咒文击败了！本关词汇已收入图鉴。${
              hasPendingSkillPick() ? " 你升级了，回冒险地图可选择技能强化！" : ""
            }`}
          />
          <div className="flex flex-col gap-3">
            {getNextStage(stage.id) ? (
              <PixelButton
                variant="gold"
                onClick={() => router.push(`/battle/${getNextStage(stage.id)!.id}`)}
              >
                前往下一关 →
              </PixelButton>
            ) : (
              <PixelPanel tone="dialog">
                <p className="font-jp text-sm text-rpg-5">
                  🎉 你已通关全部关卡，真正的勇者！
                </p>
              </PixelPanel>
            )}
            <PixelButton onClick={() => router.push("/adventure")}>
              返回冒险地图
            </PixelButton>
          </div>
        </div>
      )}

      {phase === "lose" && (
        <div className="flex flex-col gap-4">
          <DialogueBox
            speaker="败北……"
            sprite="💀"
            text={`勇者倒下了……但传说不会终结。整理好咒文，再来挑战 ${stage.enemy.name} 吧！`}
          />
          <PixelButton variant="gold" onClick={restartBattle}>
            🔄 再次挑战
          </PixelButton>
          <PixelButton onClick={() => router.push("/adventure")}>
            返回冒险地图
          </PixelButton>
        </div>
      )}
    </main>
  );
}
