"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HeroClassId } from "~/types";
import { HERO_CLASSES } from "~/data/classes";
import { ClassCard } from "~/components/game/ClassCard";
import { PixelButton } from "~/components/pixel/PixelButton";
import { useGameReady } from "~/hooks/useGameReady";
import { useGameStore } from "~/store/game";
import { playVoiceOrTts, styleSampleSrc } from "~/lib/voice";
import { SPEECH_STYLES } from "~/data/classes";

export default function SelectPage() {
  const router = useRouter();
  useGameReady();
  const savedClassId = useGameStore((s) => s.classId);
  const selectClass = useGameStore((s) => s.selectClass);

  const [picked, setPicked] = useState<HeroClassId | null>(savedClassId);

  const handleSelect = (id: HeroClassId) => {
    setPicked(id);
    // 试听该职业语体示例：优先 VoxCPM 中二配音，缺失时回退浏览器 TTS
    const cls = HERO_CLASSES.find((c) => c.id === id);
    if (cls) {
      const sample = SPEECH_STYLES[cls.styleId]?.sample ?? "";
      playVoiceOrTts(styleSampleSrc(cls.styleId), sample);
    }
  };

  const handleConfirm = () => {
    if (!picked) return;
    selectClass(picked);
    router.push("/adventure");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="text-center">
        <h1 className="font-pixel text-xl text-rpg-5">选择你的职业</h1>
        <p className="mt-2 font-jp text-sm text-rpg-14">
          职业决定你的日语说话方式 —— 点击试听语体示例
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {HERO_CLASSES.map((hero) => (
          <ClassCard
            key={hero.id}
            hero={hero}
            selected={picked === hero.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <PixelButton onClick={() => router.push("/")}>← 返回</PixelButton>
        <PixelButton
          variant="gold"
          disabled={!picked}
          onClick={handleConfirm}
        >
          {picked ? "确定，出发！" : "请先选择职业"}
        </PixelButton>
      </div>
    </main>
  );
}
