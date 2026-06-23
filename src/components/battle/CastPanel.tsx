"use client";

import { useEffect, useState } from "react";
import type { HeroClassId, Skill } from "~/types";
import type { Locale } from "~/i18n/types";
import { incantationFor, readingFor, romajiFor } from "~/lib/speech";
import { iconKeyForSkill } from "~/data/skillIcons";
import { playVoiceOrTts, skillVoiceSrc } from "~/lib/voice";
import { useSpeechCast, type CastPhase, type CastResult } from "~/hooks/useSpeechCast";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelButton } from "~/components/pixel/PixelButton";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import { ReadingHighlight } from "~/components/battle/ReadingHighlight";
import {
  getSkillDisplayName,
  getSkillMeaning,
  gradeText,
  formatMessage,
  messages,
  t,
} from "~/i18n";

interface CastPanelProps {
  skill: Skill;
  classId: HeroClassId;
  locale: Locale;
  attemptKey: number;
  onResolved: (result: CastResult) => void;
  busy?: boolean;
  onCastPhaseChange?: (phase: CastPhase) => void;
}

/** 语音施法面板 */
export function CastPanel({
  skill,
  classId,
  locale,
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
  const skillDisplayName = getSkillDisplayName(skill, locale);

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
        <div className="flex items-center justify-center gap-2">
          <SkillIcon
            iconKey={iconKeyForSkill(skill.fxKey)}
            size={36}
            title={skillDisplayName}
          />
          <div className="text-left">
            <p className="font-pixel text-[10px] text-rpg-14">
              {t(messages.cast.skillNameHint, locale)}
            </p>
            <p className="font-jp text-sm text-rpg-12">
              {skill.nameJa}（{skillDisplayName}）
            </p>
          </div>
        </div>

        <div className="mt-3 border-t-2 border-dashed border-rpg-15 pt-3">
          <p className="font-pixel text-[11px] text-rpg-5">
            {t(messages.cast.incantTitle, locale)}
          </p>
          <div className="mt-2">
            <ReadingHighlight
              incantation={incantation}
              reading={reading}
              heard={
                listening
                  ? cast.interim
                  : scored && cast.result
                    ? cast.result.heard
                    : ""
              }
              listening={listening}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              playVoiceOrTts(skillVoiceSrc(classId, skill.id), incantation)
            }
            className="touch-target mt-2 font-jp text-xs text-rpg-11 underline"
          >
            {t(messages.cast.listenDemo, locale)}
          </button>
        </div>

        <div className="mt-3 rounded border-2 border-rpg-4/40 bg-rpg-13/50 px-3 py-2 text-left">
          <p className="font-pixel text-[10px] text-rpg-4">
            {t(messages.cast.judgeTitle, locale)}
          </p>
          <p className="mt-1 font-jp text-sm text-rpg-5">
            <span className="text-rpg-14">{t(messages.cast.kanaLabel, locale)}</span>
            {reading}
          </p>
          <p className="mt-0.5 font-jp text-sm text-rpg-5">
            <span className="text-rpg-14">{t(messages.cast.romajiLabel, locale)}</span>
            {romaji || "—"}
          </p>
          <p className="mt-2 font-jp text-[10px] leading-relaxed text-rpg-14">
            {t(messages.cast.judgeHint, locale)}
          </p>
          {(skill.stageId === "plains-1" || skill.stageId === "forest-1") && (
            <p className="mt-1 font-jp text-[10px] text-rpg-11">
              {t(messages.cast.forestHint, locale)}
            </p>
          )}
        </div>

        <p className="mt-2 font-jp text-[11px] text-rpg-14">
          {formatMessage(t(messages.cast.meaning, locale), {
            text: getSkillMeaning(skill, locale),
          })}
        </p>
      </div>

      <div className="mt-4 border-t-2 border-rpg-15 pt-4">
        {cast.fallback ? (
          <div className="flex flex-col gap-2">
            <p className="font-jp text-xs text-rpg-4">
              {cast.errorMessage ?? t(messages.cast.fallbackHint, locale)}
            </p>
            <input
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              placeholder={reading || t(messages.cast.fallbackPlaceholder, locale)}
              disabled={busy}
              className="mobile-input font-jp w-full border-4 border-rpg-1 bg-rpg-13 px-3 py-2.5 text-rpg-1 outline-none"
            />
            <PixelButton
              variant="gold"
              className="w-full sm:w-auto"
              disabled={busy || !fallbackInput.trim()}
              onClick={handleFallbackSubmit}
            >
              {t(messages.cast.castSkill, locale)}
            </PixelButton>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {!scored && (
              <PixelButton
                variant={listening ? "danger" : "gold"}
                disabled={busy}
                onClick={handleMic}
                className={`w-full sm:w-auto ${listening ? "anim-cast" : ""}`}
              >
                {listening
                  ? t(messages.cast.listening, locale)
                  : t(messages.cast.startMic, locale)}
              </PixelButton>
            )}

            {listening && (
              <div className="text-center">
                <p className="font-pixel text-[10px] text-rpg-5">
                  {t(messages.cast.chantKana, locale)}
                </p>
                <p className="mt-2 font-jp text-xs text-rpg-12">
                  {cast.interim
                    ? formatMessage(t(messages.cast.interimHeard, locale), {
                        text: cast.interim,
                      })
                    : formatMessage(t(messages.cast.interimFallback, locale), {
                        incantation,
                      })}
                </p>
              </div>
            )}

            {cast.errorMessage && !scored && (
              <p className="font-jp text-xs text-rpg-4">{cast.errorMessage}</p>
            )}

            {scored && cast.result && (
              <div className="w-full text-center">
                <p className="font-jp text-xs text-rpg-14">
                  {formatMessage(t(messages.cast.heard, locale), {
                    text: cast.result.heard || t(messages.cast.notHeard, locale),
                  })}
                </p>
                <p className="mt-1 font-jp text-xs text-rpg-14">
                  {formatMessage(t(messages.cast.similarity, locale), { reading })}
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
                  {gradeText(cast.result.accuracy, locale)}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                  <PixelButton
                    className="w-full sm:w-auto"
                    disabled={busy}
                    onClick={() => {
                      cast.reset();
                      setFallbackInput("");
                    }}
                  >
                    {t(messages.cast.retry, locale)}
                  </PixelButton>
                  <PixelButton
                    variant="gold"
                    className="w-full sm:w-auto"
                    disabled={busy}
                    onClick={() => onResolved(cast.result as CastResult)}
                  >
                    {cast.result.success
                      ? t(messages.cast.release, locale)
                      : t(messages.cast.giveUp, locale)}
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
