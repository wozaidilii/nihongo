"use client";

import { useEffect, useState } from "react";
import type { Skill, SpeechStyleId } from "~/types";
import { incantationFor, readingFor } from "~/lib/speech";
import { playVoiceOrTts, skillVoiceSrc } from "~/lib/voice";
import { useSpeechCast, type CastResult } from "~/hooks/useSpeechCast";
import {
  CAST_CRIT_THRESHOLD,
  CAST_SUCCESS_THRESHOLD,
} from "~/lib/match";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";

interface CastPanelProps {
  skill: Skill;
  styleId: SpeechStyleId;
  /** 每次新的施法尝试递增，用于重置面板内部状态 */
  attemptKey: number;
  /** 玩家确认结果后回调，父级据此结算 */
  onResolved: (result: CastResult) => void;
  /** 父级动画播放中时禁用操作 */
  busy?: boolean;
}

/** 准确度对应的评价文字 */
function gradeText(acc: number): string {
  if (acc >= CAST_CRIT_THRESHOLD) return "完美咏唱！暴击！";
  if (acc >= CAST_SUCCESS_THRESHOLD) return "咏唱成功！";
  return "咏唱失败……";
}

/** 语音施法面板：念出咒文释放技能，含降级输入 */
export function CastPanel({
  skill,
  styleId,
  attemptKey,
  onResolved,
  busy = false,
}: CastPanelProps) {
  const cast = useSpeechCast();
  const incantation = incantationFor(skill, styleId);
  const reading = readingFor(skill, styleId);
  const [fallbackInput, setFallbackInput] = useState("");

  // 每次新尝试时重置面板
  useEffect(() => {
    cast.reset();
    setFallbackInput("");
    // 仅依赖 attemptKey：开启新一轮
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  const listening = cast.phase === "listening";
  const scored = cast.phase === "scored" && cast.result;

  const handleMic = () => {
    if (listening) {
      cast.stop();
    } else {
      cast.start(reading);
    }
  };

  const handleFallbackSubmit = () => {
    const res = cast.submitText(fallbackInput, reading);
    onResolved(res);
  };

  return (
    <PixelPanel className="w-full">
      {/* 咒文展示 */}
      <div className="text-center">
        <p className="font-pixel text-[11px] text-rpg-12">
          技能 · {skill.nameJa}（{skill.nameZh}）
        </p>
        <p className="mt-2 font-jp text-lg leading-relaxed text-rpg-5">
          「{incantation}」
        </p>
        <p className="mt-1 font-jp text-xs text-rpg-14">读音：{reading}</p>
        <p className="font-jp text-[11px] text-rpg-14">含义：{skill.zh}</p>
        <button
          type="button"
          onClick={() => playVoiceOrTts(skillVoiceSrc(skill.id, styleId), reading)}
          className="mt-2 font-jp text-xs text-rpg-11 underline"
        >
          🔊 听示范
        </button>
      </div>

      <div className="mt-4 border-t-2 border-rpg-15 pt-4">
        {cast.fallback ? (
          /* ---------- 降级：手动输入假名 ---------- */
          <div className="flex flex-col gap-2">
            <p className="font-jp text-xs text-rpg-4">
              {cast.errorMessage ?? "语音不可用，请输入咒文读音(假名)："}
            </p>
            <input
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              placeholder="ここに よみがなを にゅうりょく"
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
          /* ---------- 语音施法 ---------- */
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
              <p className="font-jp text-sm text-rpg-12">
                {cast.interim || "……请大声念出咒文……"}
              </p>
            )}

            {cast.errorMessage && !scored && (
              <p className="font-jp text-xs text-rpg-4">{cast.errorMessage}</p>
            )}

            {scored && cast.result && (
              <div className="w-full text-center">
                <p className="font-jp text-xs text-rpg-14">
                  识别到：{cast.result.heard || "(没听清)"}
                </p>
                <p className="mt-1 font-pixel text-2xl text-rpg-5">
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
                    {cast.result.success ? "释放！" : "硬着头皮上"}
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
