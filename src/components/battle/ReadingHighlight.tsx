"use client";

import { useMemo } from "react";
import {
  buildIncantationHighlightSegments,
  buildReadingHighlightSegments,
  computeReadingMatchProgress,
} from "~/lib/match";

interface ReadingHighlightProps {
  incantation: string;
  reading: string;
  /** 当前识别文本（实时 interim 或最终 heard） */
  heard?: string;
  /** 是否处于聆听中（聆听时显示光标） */
  listening?: boolean;
  className?: string;
}

/** 咒文 + 假名朗读进度高光 */
export function ReadingHighlight({
  incantation,
  reading,
  heard = "",
  listening = false,
  className = "",
}: ReadingHighlightProps) {
  const progress = useMemo(
    () => computeReadingMatchProgress(heard, incantation, reading),
    [heard, incantation, reading],
  );

  const incantSegments = useMemo(
    () => buildIncantationHighlightSegments(incantation, reading, progress.matched),
    [incantation, reading, progress.matched],
  );

  const readingSegments = useMemo(
    () => buildReadingHighlightSegments(reading, progress.matched),
    [reading, progress.matched],
  );

  const pct =
    progress.total > 0 ? Math.round((progress.matched / progress.total) * 100) : 0;

  return (
    <div className={className}>
      <p className="font-jp text-base leading-relaxed sm:text-lg">
        「
        {incantSegments.map((seg, i) => (
          <span
            key={`inc-${i}`}
            className={
              seg.matched
                ? "rounded-sm bg-rpg-6/35 text-rpg-5"
                : "text-rpg-5"
            }
          >
            {seg.text}
          </span>
        ))}
        」
      </p>

      <div className="mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-rpg-15">
          <div
            className="h-full bg-rpg-6 transition-all duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 font-jp text-sm leading-relaxed">
          {readingSegments.map((seg, i) => (
            <span
              key={`read-${i}`}
              className={
                seg.matched
                  ? "font-medium text-rpg-6"
                  : listening && i === readingSegments.findIndex((s) => !s.matched)
                    ? "text-rpg-5"
                    : "text-rpg-14"
              }
            >
              {seg.text}
            </span>
          ))}
          {listening && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-rpg-6 align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
