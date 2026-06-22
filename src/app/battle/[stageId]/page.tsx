"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStage, getNextStage, isStageUnlocked } from "~/data/stages";
import { getHeroClass, getStyleForClass } from "~/data/classes";
import { damageFromAccuracy } from "~/lib/match";
import { speak } from "~/lib/tts";
import { useGameReady } from "~/hooks/useGameReady";
import { useGameStore } from "~/store/game";
import { DialogueBox } from "~/components/battle/DialogueBox";
import { CastPanel } from "~/components/battle/CastPanel";
import { HpBar } from "~/components/pixel/HpBar";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import type { CastResult } from "~/hooks/useSpeechCast";

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
  const completeStage = useGameStore((s) => s.completeStage);

  const stage = getStage(stageId);
  const hero = getHeroClass(classId);
  const style = getStyleForClass(classId);

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
  const [floats, setFloats] = useState<FloatDmg[]>([]);
  const floatId = useRef(0);

  // 路由/前置条件校验：无效关卡或未解锁则回地图；未选职业回选择页
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

  // 进入关卡时初始化双方血量
  useEffect(() => {
    if (stage && hero) {
      setEnemyHp(stage.enemy.hp);
      setHeroHp(hero.stats.maxHp);
    }
  }, [stage, hero]);

  const skills = stage?.skills ?? [];
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

  // 处理一次施法结算
  const handleResolved = (result: CastResult) => {
    if (busy || !currentSkill) return;
    setBusy(true);

    const { damage, crit } = damageFromAccuracy(
      result.accuracy,
      currentSkill.baseDamage,
      hero.stats.power,
    );

    if (result.success && damage > 0) {
      // 命中敌人
      const next = Math.max(0, enemyHp - damage);
      setEnemyAnim("anim-shake anim-flash");
      pushFloat(damage, crit);
      setFeedback(
        crit ? `暴击！「${currentSkill.nameZh}」造成 ${damage} 点伤害！` : `「${currentSkill.nameZh}」造成 ${damage} 点伤害！`,
      );
      setEnemyHp(next);

      setTimeout(() => {
        setEnemyAnim("");
        if (next <= 0) {
          completeStage(stage.id, vocabIds);
          setPhase("win");
        } else {
          setSkillIndex((i) => (i + 1) % skills.length);
          setAttemptKey((k) => k + 1);
        }
        setBusy(false);
      }, 650);
    } else {
      // 施法失败：敌人反击
      const dmg = stage.enemy.attack;
      const next = Math.max(0, heroHp - dmg);
      setHeroAnim("anim-shake");
      setFeedback(`咏唱失败！${stage.enemy.name} 反击，受到 ${dmg} 点伤害！`);
      setHeroHp(next);

      setTimeout(() => {
        setHeroAnim("");
        if (next <= 0) {
          setPhase("lose");
        } else {
          setAttemptKey((k) => k + 1);
        }
        setBusy(false);
      }, 650);
    }
  };

  const restartBattle = () => {
    setEnemyHp(stage.enemy.hp);
    setHeroHp(hero.stats.maxHp);
    setSkillIndex(0);
    setAttemptKey((k) => k + 1);
    setFeedback("");
    setPhase("battle");
  };

  // ===== 渲染各阶段 =====
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
          {/* 战场 */}
          <PixelPanel
            tone="dialog"
            className="relative flex items-center justify-between"
          >
            <div className="flex flex-col items-center gap-2">
              <div className={heroAnim}>
                <PixelSprite glyph={hero.sprite} size={52} bob={!busy} />
              </div>
              <div className="w-28">
                <HpBar current={heroHp} max={hero.stats.maxHp} tone="hero" />
              </div>
            </div>

            <span className="font-pixel text-xs text-rpg-4">VS</span>

            <div className="relative flex flex-col items-center gap-2">
              <div className={enemyAnim}>
                <PixelSprite glyph={stage.enemy.sprite} size={56} bob={!busy} />
              </div>
              <div className="w-28">
                <HpBar current={enemyHp} max={stage.enemy.hp} tone="enemy" label={stage.enemy.name} />
              </div>
              {/* 浮动伤害数字 */}
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
            styleId={style.id}
            attemptKey={attemptKey}
            onResolved={handleResolved}
            busy={busy}
          />
        </div>
      )}

      {phase === "win" && (
        <div className="flex flex-col gap-4">
          <DialogueBox
            speaker="胜利！"
            sprite="🏆"
            text={`讨伐成功！${stage.enemy.name} 被你的中二咒文击败了！本关词汇已收入图鉴。`}
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
