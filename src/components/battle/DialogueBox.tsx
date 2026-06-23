"use client";

import { useState } from "react";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import { Typewriter } from "~/components/pixel/Typewriter";
import { PixelButton } from "~/components/pixel/PixelButton";
import { useLocale } from "~/hooks/useLocale";
import { messages, t } from "~/i18n/messages";

interface DialogueBoxProps {
  speaker?: string;
  sprite?: string;
  text: string;
  onNext?: () => void;
  nextLabel?: string;
}

/** JRPG 风对话框：打字机展示，打完后出现「继续」 */
export function DialogueBox({
  speaker,
  sprite,
  text,
  onNext,
  nextLabel,
}: DialogueBoxProps) {
  const [done, setDone] = useState(false);
  const { locale } = useLocale();
  const continueLabel = nextLabel ?? t(messages.common.continue, locale);

  return (
    <PixelPanel tone="dialog" className="w-full">
      <div className="flex items-start gap-2 sm:gap-3">
        {sprite && <PixelSprite glyph={sprite} size={32} className="shrink-0 sm:hidden" />}
        {sprite && <PixelSprite glyph={sprite} size={40} className="hidden shrink-0 sm:block" />}
        <div className="flex-1">
          {speaker && (
            <p className="mb-1 font-pixel text-[11px] text-rpg-5">{speaker}</p>
          )}
          <p className="min-h-[3.5rem] font-jp text-sm leading-relaxed text-rpg-13">
            <Typewriter text={text} onDone={() => setDone(true)} />
          </p>
        </div>
      </div>
      {onNext && done && (
        <div className="mt-3 flex justify-stretch sm:justify-end">
          <PixelButton variant="gold" className="w-full sm:w-auto" onClick={onNext}>
            {continueLabel}
          </PixelButton>
        </div>
      )}
    </PixelPanel>
  );
}
