"use client";

import { CharacterSprite } from "~/components/pixel/CharacterSprite";
import { HERO_CLASSES } from "~/data/classes";

/** 标题页勇者游戏风封面：四职业 + 影龙 + 像素框 */
export function TitleCover() {
  return (
    <section className="title-cover relative w-full max-w-2xl overflow-visible">
      {/* 背景层：星空 + 远山剪影 */}
      <div className="title-cover-bg absolute inset-0" aria-hidden />
      <div className="title-cover-stars absolute inset-0" aria-hidden />

      {/* 影龙：置于标题框上方，避免被面板遮挡 */}
      <div className="relative z-20 flex justify-center pt-5">
        <CharacterSprite
          kind="enemy"
          id="dragon"
          fallbackGlyph="🐉"
          state="idle"
          playing
          bob
          className="scale-90 sm:scale-100"
          label="影のドラゴン"
        />
      </div>

      {/* 主标题框 */}
      <div className="relative z-10 mx-auto mt-2 w-[92%] border-4 border-rpg-13 bg-rpg-1/90 px-4 py-6 shadow-[8px_8px_0_0_#000] sm:mt-3 sm:px-8 sm:py-8">
        <div className="absolute -top-3 left-4 bg-rpg-1 px-2">
          <span className="font-pixel text-[9px] text-rpg-12 sm:text-[10px]">
            PIXEL QUEST
          </span>
        </div>
        <p className="font-pixel text-[10px] tracking-wider text-rpg-4 sm:text-xs">
          〜 中二咒文学日语 〜
        </p>
        <h1 className="title-cover-logo mt-3 font-pixel text-2xl leading-relaxed text-rpg-5 sm:text-4xl">
          吟唱勇者
        </h1>
        <p className="mt-4 font-jp text-sm leading-relaxed text-rpg-14 sm:text-base">
          选职业 · 念咒文 · 放技能
          <br />
          在像素冒险里学日语！
        </p>
      </div>

      {/* 四勇者列队 */}
      <div className="relative z-10 mx-auto mt-8 flex w-full max-w-lg items-end justify-between gap-1 px-2 sm:gap-3 sm:px-4">
        {HERO_CLASSES.map((hero) => (
          <div key={hero.id} className="flex flex-col items-center gap-1">
            <CharacterSprite
              kind="hero"
              id={hero.spriteKey}
              fallbackGlyph={hero.sprite}
              state="idle"
              playing
              bob
              className="origin-bottom scale-90 sm:scale-100"
              label={hero.nameZh}
            />
            <span className="font-pixel text-[8px] text-rpg-12 sm:text-[9px]">
              {hero.nameZh}
            </span>
          </div>
        ))}
      </div>

      {/* 底部装饰条 */}
      <div className="relative z-10 mx-auto mt-6 flex w-[88%] items-center justify-between border-t-4 border-rpg-15 pt-3">
        <span className="font-pixel text-[8px] text-rpg-15 sm:text-[9px]">LV.1</span>
        <span className="anim-title-blink font-pixel text-[9px] text-rpg-5 sm:text-[10px]">
          ▶ ADVENTURE
        </span>
        <span className="font-pixel text-[8px] text-rpg-15 sm:text-[9px]">N5</span>
      </div>
    </section>
  );
}
