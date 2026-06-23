import { messages, t } from "~/i18n/messages";
import type { Locale } from "~/i18n/types";

interface TitleCoverProps {
  locale: Locale;
}

/** 标题页：像素 RPG 标题画面，主视觉优先展示魔王城。 */
export function TitleCover({ locale }: TitleCoverProps) {
  return (
    <section className="title-cover relative w-full max-w-4xl overflow-hidden">
      <div className="title-cover-bg absolute inset-0" aria-hidden />
      <div className="title-cover-art absolute inset-0" aria-hidden />
      <div className="title-cover-vignette absolute inset-0" aria-hidden />
      <div className="title-cover-fog absolute inset-x-0 bottom-0 h-24" aria-hidden />

      <div className="title-cover-lockup absolute z-10">
        <p className="title-cover-kicker font-pixel text-rpg-12">
          {t(messages.title.tagline, locale)}
        </p>
        <h1 className="title-cover-logo mt-3 font-pixel leading-relaxed text-rpg-5">
          {t(messages.title.gameTitle, locale)}
        </h1>
        <p className="title-cover-keep mt-2 font-pixel text-rpg-4">
          {t(messages.title.castleName, locale)}
        </p>
      </div>

      <div className="title-cover-footer absolute inset-x-0 bottom-0 z-10 mx-auto flex items-center justify-between">
        <span className="font-pixel text-rpg-14">LV.? ?</span>
        <span className="anim-title-blink font-pixel text-rpg-5">
          {t(messages.title.adventureBlink, locale)}
        </span>
        <span className="font-pixel text-rpg-14">N5</span>
      </div>
    </section>
  );
}
