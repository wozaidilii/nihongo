"use client";

import type { HeroClass } from "~/types";
import { SPEECH_STYLES } from "~/data/classes";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";

interface ClassCardProps {
  hero: HeroClass;
  selected: boolean;
  onSelect: (id: HeroClass["id"]) => void;
}

/** 职业选择卡片：展示职业、语体与属性 */
export function ClassCard({ hero, selected, onSelect }: ClassCardProps) {
  const style = SPEECH_STYLES[hero.styleId];

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
            label={hero.nameZh}
          />
          <div>
            <p className="font-pixel text-sm text-rpg-5">{hero.nameZh}</p>
            <p className="font-jp text-xs text-rpg-12">{hero.nameJa}</p>
          </div>
        </div>

        <p className="mt-3 font-jp text-xs leading-relaxed text-rpg-13">
          {hero.description}
        </p>

        <div className="mt-3 border-t-2 border-rpg-15 pt-3">
          <p className="font-jp text-xs text-rpg-6">
            语体：{style?.nameZh}（{style?.nameJa}）
          </p>
          <p className="font-jp text-xs text-rpg-14">口癖：{style?.signature}</p>
          <p className="mt-1 font-jp text-[11px] text-rpg-14">
            「{style?.sample}」
          </p>
        </div>

        <div className="mt-3 flex gap-4 font-pixel text-[10px] text-rpg-12">
          <span>HP {hero.stats.maxHp}</span>
          <span>POW x{hero.stats.power.toFixed(2)}</span>
        </div>

        {selected && (
          <p className="mt-3 font-pixel text-[10px] text-rpg-5">▶ 已选择</p>
        )}
      </PixelPanel>
    </button>
  );
}
