"use client";

import { useRouter } from "next/navigation";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import { useGameReady } from "~/hooks/useGameReady";
import { useGameStore } from "~/store/game";
import { getHeroClass } from "~/data/classes";

export default function TitlePage() {
  const router = useRouter();
  const ready = useGameReady();
  const classId = useGameStore((s) => s.classId);
  const level = useGameStore((s) => s.level);
  const hero = getHeroClass(classId);

  const hasSave = ready && !!hero;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <p className="font-pixel text-xs text-rpg-12">ピクセル勇者</p>
        <h1 className="mt-3 font-pixel text-2xl leading-relaxed text-rpg-5 sm:text-4xl">
          勇者日语探险
        </h1>
        <p className="mt-4 font-jp text-base text-rpg-14">
          念出中二咒文，释放技能，讨伐怪兽 —— 在冒险中学日语！
        </p>
      </div>

      <div className="flex gap-3 text-5xl">
        <PixelSprite glyph="🛡️" size={56} bob />
        <PixelSprite glyph="🔮" size={56} bob />
        <PixelSprite glyph="🗡️" size={56} bob />
        <PixelSprite glyph="⚔️" size={56} bob />
      </div>

      <PixelPanel tone="dialog" className="w-full max-w-md">
        <div className="flex flex-col gap-4">
          {hasSave ? (
            <>
              <p className="font-jp text-sm text-rpg-13">
                欢迎回来，
                <span className="text-rpg-5">{hero?.nameZh}</span> 勇者(Lv.{level})！
              </p>
              <PixelButton variant="gold" onClick={() => router.push("/adventure")}>
                继续冒险
              </PixelButton>
              <PixelButton onClick={() => router.push("/select")}>
                重选职业
              </PixelButton>
            </>
          ) : (
            <>
              <p className="font-jp text-sm text-rpg-13">
                选择你的职业，不同职业学习不同的日语说话方式。
              </p>
              <PixelButton variant="gold" onClick={() => router.push("/select")}>
                开始冒险
              </PixelButton>
            </>
          )}
        </div>
      </PixelPanel>

      <p className="font-pixel text-[10px] text-rpg-15">
        建议使用 Chrome / Edge 以获得语音识别体验
      </p>
    </main>
  );
}
