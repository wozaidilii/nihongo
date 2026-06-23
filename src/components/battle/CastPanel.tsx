"use client";

import { useEffect, useState } from "react";
import type { HeroClassId, Skill } from "~/types";
import { incantationFor, readingFor, romajiFor } from "~/lib/speech";
import { playVoiceOrTts, skillVoiceSrc } from "~/lib/voice";
import { useSpeechCast, type CastPhase, type CastResult } from "~/hooks/useSpeechCast";
import {
  CAST_CRIT_THRESHOLD,
  CAST_GOOD_THRESHOLD,
  powerScaleFromAccuracy,
} from "~/lib/match";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";

interface CastPanelProps {
  skill: Skill;
  classId: HeroClassId;
  attemptKey: number;
  onResolved: (result: CastResult) => void;
  busy?: boolean;
  onCastPhaseChange?: (phase: CastPhase) => void;
}

/** 准确度 → 评价（含威力说明） */
function gradeText(acc: number): string {
  const powerPct = Math.round(powerScaleFromAccuracy(acc) * 100);
  if (acc >= 100) return `咒文完美匹配 → 威力 ${powerPct}%`;
  if (acc >= CAST_CRIT_THRESHOLD) return `咒文完美匹配 · 暴击！→ 威力 ${powerPct}%`;
  if (acc >= CAST_GOOD_THRESHOLD) return `咒文匹配良好 → 威力 ${powerPct}%`;
  if (acc > 0) return `咒文部分匹配 → 威力 ${powerPct}%`;
  return "未听清咒文，无法施法";
}

/** 语音施法面板 */
export function CastPanel({
  skill,
  classId,
  attemptKey,
  onResolved,
  busy = false,
  onCastPhaseChange,
}: CastPanelProps) {
  const cast = useSpeechCast();
  const incantation = incantationFor(skill);
  const reading = readingFor(skill);
  const romaji = romajiFor(skill);
  const castTarget = { incantation, reading, stageId: skill.stageId };
  const [fallbackInput, setFallbackInput] = useState("");

  useEffect(() => {
    cast.reset();
    setFallbackInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  useEffect(() => {
    onCastPhaseChange?.(cast.phase);
  }, [cast.phase, onCastPhaseChange]);

  const listening = cast.phase === "listening";
  const scored = cast.phase === "scored" && cast.result;

  const handleMic = () => {
    if (listening) cast.stop();
    else cast.start(castTarget);
  };

  const handleFallbackSubmit = () => {
    const res = cast.submitText(fallbackInput, castTarget);
    onResolved(res);
  };

  return (
    <PixelPanel className="w-full">
      <div className="text-center">
        {/* 技能名：仅展示，不参与判定 */}
        <p className="font-pixel text-[10px] text-rpg-14">技能名（不用念）</p>
        <p className="font-jp text-sm text-rpg-12">
          {skill.nameJa}（{skill.nameZh}）
        </p>

        {/* 咏唱咒文：玩家实际要念的内容 */}
        <div className="mt-3 border-t-2 border-dashed border-rpg-15 pt-3">
          <p className="font-pixel text-[11px] text-rpg-5">咏唱咒文 · 请念这个</p>
          <p className="mt-2 font-jp text-lg leading-relaxed text-rpg-5">
            「{incantation}」
          </p>
          <button
            type="button"
            onClick={() =>
              playVoiceOrTts(skillVoiceSrc(classId, skill.id), incantation)
            }
            className="mt-2 font-jp text-xs text-rpg-11 underline"
          >
            🔊 听示范
          </button>
        </div>

        {/* 判定对照：语音识别比对此假名，决定威力 */}
        <div className="mt-3 rounded border-2 border-rpg-4/40 bg-rpg-13/50 px-3 py-2 text-left">
          <p className="font-pixel text-[10px] text-rpg-4">
            判定对照 · 威力看匹配度
          </p>
          <p className="mt-1 font-jp text-sm text-rpg-5">
            <span className="text-rpg-14">假名：</span>
            {reading}
          </p>
          <p className="mt-0.5 font-jp text-sm text-rpg-5">
            <span className="text-rpg-14">罗马音：</span>
            {romaji || "—"}
          </p>
          <p className="mt-2 font-jp text-[10px] leading-relaxed text-rpg-14">
            可念汉字咒文或假名；系统把你念的内容与上方假名比对，相似度越高威力越大（与技能名无关）。
          </p>
          {skill.stageId === "forest-1" && (
            <p className="mt-1 font-jp text-[10px] text-rpg-11">
              第一关提示：念对核心假名即可施法，不必一字不差。
            </p>
          )}
        </div>

        <p className="mt-2 font-jp text-[11px] text-rpg-14">含义：{skill.zh}</p>
      </div>

      <div className="mt-4 border-t-2 border-rpg-15 pt-4">
        {cast.fallback ? (
          <div className="flex flex-col gap-2">
            <p className="font-jp text-xs text-rpg-4">
              {cast.errorMessage ??
                "语音不可用，请输入咒文（汉字或假名均可）："}
            </p>
            <input
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              placeholder={reading || "よみがなを にゅうりょく"}
              disabled={busy}
              className="font-jp w-full border-4 border-rpg-1 bg-rpg-13 px-3 py-2 text-sm text-rpg-1 outline-none"
            />
            <PixelButton
              variant="gold"
              disabled={busy || !fallbackInput.trim()}
              onClick={handleFallbackSubmit}
            >
              释放技能
            </PixelButton>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {!scored && (
              <PixelButton
                variant={listening ? "danger" : "gold"}
                disabled={busy}
                onClick={handleMic}
                className={listening ? "anim-cast" : ""}
              >
                {listening ? "🔴 聆听中…(点此结束)" : "🎤 念出咒文"}
              </PixelButton>
            )}

            {listening && (
              <div className="text-center">
                <p className="font-pixel text-[10px] text-rpg-5">请念假名（推荐）</p>
                <p className="mt-1 font-jp text-base text-rpg-5">{reading}</p>
                <p className="mt-2 font-jp text-xs text-rpg-12">
                  {cast.interim || `……或念汉字咒文「${incantation}」……`}
                </p>
              </div>
            )}

            {cast.errorMessage && !scored && (
              <p className="font-jp text-xs text-rpg-4">{cast.errorMessage}</p>
            )}

            {scored && cast.result && (
              <div className="w-full text-center">
                <p className="font-jp text-xs text-rpg-14">
                  识别到：{cast.result.heard || "(没听清)"}
                </p>
                <p className="mt-1 font-jp text-xs text-rpg-14">
                  与假名「{reading}」相似度
                  {cast.result.matchPath ? ` · ${cast.result.matchPath}` : ""}
                </p>
                <p className="font-pixel text-2xl text-rpg-5">
                  {cast.result.accuracy}%
                </p>
                <p
                  className={`font-jp text-sm ${
                    cast.result.success ? "text-rpg-6" : "text-rpg-3"
                  }`}
                >
                  {gradeText(cast.result.accuracy)}
                </p>
                <div className="mt-3 flex justify-center gap-3">
                  <PixelButton
                    disabled={busy}
                    onClick={() => {
                      cast.reset();
                      setFallbackInput("");
                    }}
                  >
                    再试一次
                  </PixelButton>
                  <PixelButton
                    variant="gold"
                    disabled={busy}
                    onClick={() => onResolved(cast.result as CastResult)}
                  >
                    {cast.result.success ? "释放！" : "放弃咏唱"}
                  </PixelButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PixelPanel>
  );
}
