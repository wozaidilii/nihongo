"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HeroClassId } from "~/types";
import { HERO_CLASSES } from "~/data/classes";
import { ClassCard } from "~/components/game/ClassCard";
import { PageShell } from "~/components/game/PageShell";
import { PixelButton } from "~/components/pixel/PixelButton";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { useGameStore } from "~/store/game";
import { playVoiceOrTts, styleSampleSrc } from "~/lib/voice";
import { SPEECH_STYLES } from "~/data/classes";
import { messages, t } from "~/i18n/messages";

export default function SelectPage() {
  const router = useRouter();
  useGameReady();
  const { locale } = useLocale();
  const savedClassId = useGameStore((s) => s.classId);
  const selectClass = useGameStore((s) => s.selectClass);

  const [picked, setPicked] = useState<HeroClassId | null>(savedClassId);

  const handleSelect = (id: HeroClassId) => {
    setPicked(id);
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
    <PageShell width="lg">
      <header className="text-center">
        <h1 className="font-pixel text-lg text-rpg-5 sm:text-xl">
          {t(messages.select.title, locale)}
        </h1>
        <p className="mt-2 font-jp text-xs text-rpg-14 sm:text-sm">
          {t(messages.select.subtitle, locale)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {HERO_CLASSES.map((hero) => (
          <ClassCard
            key={hero.id}
            hero={hero}
            locale={locale}
            selected={picked === hero.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PixelButton className="w-full sm:w-auto" onClick={() => router.push("/")}>
          {t(messages.common.back, locale)}
        </PixelButton>
        <PixelButton
          variant="gold"
          className="w-full sm:w-auto"
          disabled={!picked}
          onClick={handleConfirm}
        >
          {picked ? t(messages.select.confirm, locale) : t(messages.select.pickFirst, locale)}
        </PixelButton>
      </div>
    </PageShell>
  );
}
