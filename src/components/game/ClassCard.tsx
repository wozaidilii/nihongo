"use client";

import type { HeroClass } from "~/types";
import type { Locale } from "~/i18n/types";
import { SPEECH_STYLES } from "~/data/classes";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import {
  getClassDescription,
  getSpeechStyleName,
  heroName,
  messages,
  t,
} from "~/i18n";

interface ClassCardProps {
  hero: HeroClass;
  locale: Locale;
  selected: boolean;
  onSelect: (id: HeroClass["id"]) => void;
}

/** 职业选择卡片：展示职业、语体与属性 */
export function ClassCard({ hero, locale, selected, onSelect }: ClassCardProps) {
  const style = SPEECH_STYLES[hero.styleId];
  const name = heroName(hero.id, locale);

  return (
    <button
      type="button"
      onClick={() => onSelect(hero.id)}
      className="block w-full text-left"
      aria-pressed={selected}
    >
      <PixelPanel
        className={`h-full transition-transform ${
          selected ? "translate-x-1 -translate-y-1" : ""
        }`}
        style={
          selected
            ? { backgroundColor: "var(--color-rpg-8)" }
            : undefined
        }
      >
        <div className="flex items-center gap-4">
          <CharacterSprite
            kind="hero"
            id={hero.spriteKey}
            fallbackGlyph={hero.sprite}
            state="idle"
            bob={selected}
            label={name}
          />
          <div>
            <p className="font-pixel text-sm text-rpg-5">{name}</p>
            <p className="font-jp text-xs text-rpg-12">{hero.nameJa}</p>
          </div>
        </div>

        <p className="mt-3 font-jp text-xs leading-relaxed text-rpg-13">
          {getClassDescription(hero, locale)}
        </p>

        <div className="mt-3 border-t-2 border-rpg-15 pt-3">
          <p className="font-jp text-xs text-rpg-6">
            {t(messages.common.speechStyle, locale)}：{style ? getSpeechStyleName(style, locale) : ""}
            （{style?.nameJa}）
          </p>
          <p className="font-jp text-xs text-rpg-14">
            {t(messages.common.signature, locale)}：{style?.signature}
          </p>
          <p className="mt-1 font-jp text-[11px] text-rpg-14">
            「{style?.sample}」
          </p>
        </div>

        <div className="mt-3 flex gap-4 font-pixel text-[10px] text-rpg-12">
          <span>HP {hero.stats.maxHp}</span>
          <span>POW x{hero.stats.power.toFixed(2)}</span>
        </div>

        {selected && (
          <p className="mt-3 font-pixel text-[10px] text-rpg-5">
            {t(messages.classCard.selected, locale)}
          </p>
        )}
      </PixelPanel>
    </button>
  );
}
