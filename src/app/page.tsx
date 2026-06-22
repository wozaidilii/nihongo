"use client";

import { useRouter } from "next/navigation";
import { TitleCover } from "~/components/game/TitleCover";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 sm:gap-8 sm:p-6">
      <TitleCover />

      <PixelPanel tone="dialog" className="relative z-10 w-full max-w-md">
        <div className="flex flex-col gap-4">
          {hasSave ? (
            <>
              <p className="font-jp text-sm text-rpg-13">
                欢迎回来，
                <span className="text-rpg-5">{hero?.nameZh}</span> 勇者 (Lv.{level})！
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
                选择职业开始冒险。不同职业学习不同的日语说话方式！
              </p>
              <PixelButton variant="gold" onClick={() => router.push("/select")}>
                开始冒险
              </PixelButton>
            </>
          )}
        </div>
      </PixelPanel>

      <p className="relative z-10 font-pixel text-[10px] text-rpg-15">
        建议使用 Chrome / Edge 以获得语音识别体验
      </p>
    </main>
  );
}
