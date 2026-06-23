"use client";

import { useState } from "react";
import { messages, t } from "~/i18n/messages";
import type { Locale } from "~/i18n/types";

interface TitleCoverProps {
  locale: Locale;
}

/** 标题页：魔王城主题（无角色/怪物精灵） */
export function TitleCover({ locale }: TitleCoverProps) {
  const subtitleLines = t(messages.title.subtitle, locale).split("\n");
  const [useBitmapCastle, setUseBitmapCastle] = useState(false);

  return (
    <section className="title-cover relative w-full max-w-2xl overflow-hidden">
      <div className="title-cover-bg absolute inset-0" aria-hidden />
      <div className="title-cover-stars absolute inset-0" aria-hidden />
      <div className="title-cover-moon absolute" aria-hidden />

      <div className="title-cover-castle relative z-[5] mx-auto mt-6 flex justify-center sm:mt-8" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sprites/title/demon-castle.png"
          alt=""
          className={`title-cover-castle-img${useBitmapCastle ? " is-loaded" : ""}`}
          onLoad={() => setUseBitmapCastle(true)}
        />
        {!useBitmapCastle && <div className="title-cover-castle-art" />}
      </div>

      <div className="relative z-10 mx-auto -mt-2 w-[92%] border-4 border-rpg-13 bg-rpg-1/92 px-4 py-6 shadow-[8px_8px_0_0_#000] backdrop-blur-[1px] sm:mt-0 sm:px-8 sm:py-8">
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
