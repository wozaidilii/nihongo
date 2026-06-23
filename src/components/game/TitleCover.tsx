"use client";

import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { HERO_CLASSES } from "~/data/classes";
import { heroName, messages, t } from "~/i18n/messages";
import type { Locale } from "~/i18n/types";

interface TitleCoverProps {
  locale: Locale;
}

/** 标题页勇者游戏风封面：四职业 + 影龙 + 像素框 */
export function TitleCover({ locale }: TitleCoverProps) {
  const subtitleLines = t(messages.title.subtitle, locale).split("\n");

  return (
    <section className="title-cover relative w-full max-w-2xl overflow-visible">
      <div className="title-cover-bg absolute inset-0" aria-hidden />
      <div className="title-cover-stars absolute inset-0" aria-hidden />

      <div className="relative z-20 flex justify-center pt-5">
        <CharacterSprite
          kind="enemy"
          id="dragon"
          fallbackGlyph="🐉"
          state="idle"
          playing
          bob
          className="scale-90 sm:scale-100"
          label={t(messages.title.dragonLabel, locale)}
        />
      </div>

      <div className="relative z-10 mx-auto mt-2 w-[92%] border-4 border-rpg-13 bg-rpg-1/90 px-4 py-6 shadow-[8px_8px_0_0_#000] sm:mt-3 sm:px-8 sm:py-8">
        <div className="absolute -top-3 left-4 bg-rpg-1 px-2">
          <span className="font-pixel text-[9px] text-rpg-12 sm:text-[10px]">
            PIXEL QUEST
          </span>
        </div>
        <p className="font-pixel text-[10px] tracking-wider text-rpg-4 sm:text-xs">
          {t(messages.title.tagline, locale)}
        </p>
        <h1 className="title-cover-logo mt-3 font-pixel text-2xl leading-relaxed text-rpg-5 sm:text-4xl">
          {t(messages.title.gameTitle, locale)}
        </h1>
        <p className="mt-4 font-jp text-sm leading-relaxed text-rpg-14 sm:text-base">
          {subtitleLines.map((line, i) => (
            <span key={line}>
              {line}
              {i < subtitleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-6 grid w-full max-w-lg grid-cols-4 gap-0.5 px-1 sm:mt-8 sm:flex sm:items-end sm:justify-between sm:gap-3 sm:px-4">
        {HERO_CLASSES.map((hero) => (
          <div key={hero.id} className="flex flex-col items-center gap-0.5 sm:gap-1">
            <CharacterSprite
              kind="hero"
              id={hero.spriteKey}
              fallbackGlyph={hero.sprite}
              state="idle"
              playing
              bob
              className="origin-bottom scale-[0.72] sm:scale-100"
              label={heroName(hero.id, locale)}
            />
            <span className="max-w-[4.5rem] truncate text-center font-pixel text-[7px] text-rpg-12 sm:max-w-none sm:text-[9px]">
              {heroName(hero.id, locale)}
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto mt-6 flex w-[88%] items-center justify-between border-t-4 border-rpg-15 pt-3">
        <span className="font-pixel text-[8px] text-rpg-15 sm:text-[9px]">LV.1</span>
        <span className="anim-title-blink font-pixel text-[9px] text-rpg-5 sm:text-[10px]">
          {t(messages.title.adventureBlink, locale)}
        </span>
        <span className="font-pixel text-[8px] text-rpg-15 sm:text-[9px]">N5</span>
      </div>
    </section>
  );
}
