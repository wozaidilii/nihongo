"use client";

import { useState } from "react";
import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { messages, t } from "~/i18n/messages";
import type { Locale } from "~/i18n/types";

interface TitleCoverProps {
  locale: Locale;
}

/** 标题页：LPC 魔王城贴图 + 魔王（Warlock's Gauntlet demon） */
export function TitleCover({ locale }: TitleCoverProps) {
  const subtitleLines = t(messages.title.subtitle, locale).split("\n");
  const [castleReady, setCastleReady] = useState(false);

  return (
    <section className="title-cover relative w-full max-w-2xl overflow-hidden">
      <div className="title-cover-bg absolute inset-0" aria-hidden />
      <div className="title-cover-stars absolute inset-0" aria-hidden />
      <div className="title-cover-moon absolute" aria-hidden />
      <div className="title-cover-fog absolute inset-x-0 bottom-0 h-24" aria-hidden />

      <div className="title-cover-scene relative z-[5] mx-auto px-2 pt-4 sm:px-4 sm:pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sprites/title/demon-castle.png"
          alt=""
          className={`title-cover-castle-img mx-auto${castleReady ? " is-loaded" : ""}`}
          onLoad={() => setCastleReady(true)}
        />

        <div className="title-cover-boss-wrap">
          <div className="title-cover-boss-glow" aria-hidden />
          <div className="title-cover-boss-sprite-wrap anim-title-boss-float">
            <div className="title-cover-boss-sprite">
              <CharacterSprite
                kind="enemy"
                id="demon_lord"
                fallbackGlyph="👹"
                state="idle"
                playing
                label={t(messages.title.finalBossName, locale)}
              />
            </div>
          </div>
          <div className="title-cover-boss-plate">
            <span className="title-cover-boss-tag font-pixel">
              {t(messages.title.finalBossTag, locale)}
            </span>
            <span className="title-cover-boss-name font-jp">
              {t(messages.title.finalBossName, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-1 w-[92%] border-4 border-rpg-13 bg-rpg-1/92 px-4 py-6 shadow-[8px_8px_0_0_#000] backdrop-blur-[1px] sm:mt-2 sm:px-8 sm:py-8">
        <div className="absolute -top-3 left-4 bg-rpg-1 px-2">
          <span className="font-pixel text-[9px] text-rpg-12 sm:text-[10px]">
            {t(messages.title.badge, locale)}
          </span>
        </div>
        <p className="font-pixel text-[10px] tracking-wider text-rpg-4 sm:text-xs">
          {t(messages.title.tagline, locale)}
        </p>
        <h1 className="title-cover-logo mt-3 font-pixel text-2xl leading-relaxed text-rpg-5 sm:text-4xl">
          {t(messages.title.gameTitle, locale)}
        </h1>
        <p className="mt-1 font-pixel text-xs text-rpg-3 sm:text-sm">
          {t(messages.title.castleName, locale)}
        </p>
        <p className="mt-4 font-jp text-sm leading-relaxed text-rpg-14 sm:text-base">
          {subtitleLines.map((line, i) => (
            <span key={line}>
              {line}
              {i < subtitleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-6 flex w-[88%] items-center justify-between border-t-4 border-rpg-15 pt-3">
        <span className="font-pixel text-[8px] text-rpg-15 sm:text-[9px]">LV.? ?</span>
        <span className="anim-title-blink font-pixel text-[9px] text-rpg-5 sm:text-[10px]">
          {t(messages.title.adventureBlink, locale)}
        </span>
        <span className="font-pixel text-[8px] text-rpg-15 sm:text-[9px]">N5</span>
      </div>
    </section>
  );
}
