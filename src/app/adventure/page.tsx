"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STAGES_ORDERED, isStageUnlocked } from "~/data/stages";
import { getHeroClass, getStyleForClass } from "~/data/classes";
import { MapNode } from "~/components/game/MapNode";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { PixelSprite } from "~/components/pixel/PixelSprite";
import { useGameReady } from "~/hooks/useGameReady";
import { useGameStore } from "~/store/game";

export default function AdventurePage() {
  const router = useRouter();
  const ready = useGameReady();
  const classId = useGameStore((s) => s.classId);
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const clearedStageIds = useGameStore((s) => s.clearedStageIds);

  const hero = getHeroClass(classId);
  const style = getStyleForClass(classId);

  // 未选职业则回到选择页(等水合完成再判断)
  useEffect(() => {
    if (ready && !classId) router.replace("/select");
  }, [ready, classId, router]);

  if (!ready || !hero) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-pixel text-xs text-rpg-12">加载中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <PixelPanel tone="dialog" className="flex items-center gap-4">
        <PixelSprite glyph={hero.sprite} size={48} bob />
        <div className="flex-1">
          <p className="font-pixel text-sm text-rpg-5">
            {hero.nameZh} · Lv.{level}
          </p>
          <p className="font-jp text-xs text-rpg-12">
            语体：{style.nameZh}（{style.nameJa}）
          </p>
          <p className="font-pixel text-[10px] text-rpg-14">EXP {exp}</p>
        </div>
      </PixelPanel>

      <header className="text-center">
        <h1 className="font-pixel text-lg text-rpg-5">冒险地图</h1>
        <p className="mt-1 font-jp text-xs text-rpg-14">选择关卡，开始讨伐！</p>
      </header>

      <div className="flex flex-col gap-4">
        {STAGES_ORDERED.map((stage) => (
          <MapNode
            key={stage.id}
            stage={stage}
            unlocked={isStageUnlocked(stage.id, clearedStageIds)}
            cleared={clearedStageIds.includes(stage.id)}
            onEnter={(id) => router.push(`/battle/${id}`)}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <PixelButton onClick={() => router.push("/")}>← 返回标题</PixelButton>
      </div>
    </main>
  );
}
