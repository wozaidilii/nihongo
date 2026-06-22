"use client";

import { useState } from "react";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import { Typewriter } from "~/components/pixel/Typewriter";
import { PixelButton } from "~/components/pixel/PixelButton";

interface DialogueBoxProps {
  speaker?: string;
  sprite?: string;
  text: string;
  /** 点击继续的回调；不传则不显示继续按钮 */
  onNext?: () => void;
  nextLabel?: string;
}

/** JRPG 风对话框：打字机展示，打完后出现「继续」 */
export function DialogueBox({
  speaker,
  sprite,
  text,
  onNext,
  nextLabel = "▶ 继续",
}: DialogueBoxProps) {
  const [done, setDone] = useState(false);

  return (
    <PixelPanel tone="dialog" className="w-full">
      <div className="flex items-start gap-3">
        {sprite && <PixelSprite glyph={sprite} size={40} />}
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
        <div className="mt-3 flex justify-end">
          <PixelButton variant="gold" onClick={onNext}>
            {nextLabel}
          </PixelButton>
        </div>
      )}
    </PixelPanel>
  );
}
