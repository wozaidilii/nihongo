"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getHeroClass } from "~/data/classes";
import { PageShell } from "~/components/game/PageShell";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { formatMessage, heroName, messages, t } from "~/i18n/messages";
import type { Locale } from "~/i18n/types";
import {
  isSlotOccupied,
  loadSaveRoot,
} from "~/lib/storage";
import { useGameStore } from "~/store/game";
import type { SaveSlotData, SaveSlotIndex } from "~/types";
import { SAVE_SLOT_COUNT } from "~/types";

type SlotMode = "continue" | "new";

function formatSavedAt(ts: number, locale: Locale): string {
  if (!ts) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function slotSummary(slot: SaveSlotData, locale: Locale): string {
  if (!isSlotOccupied(slot)) {
    return t(messages.slots.empty, locale);
  }
  const hero = getHeroClass(slot.classId);
  const name = hero ? heroName(hero.id, locale) : "???";
  return formatMessage(t(messages.slots.occupied, locale), {
    name,
    level: slot.level,
    cleared: slot.clearedStageIds.length,
  });
}

function SlotsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ready = useGameReady();
  const { locale } = useLocale();
  const continueFromSlot = useGameStore((s) => s.continueFromSlot);
  const prepareNewGameSlot = useGameStore((s) => s.prepareNewGameSlot);

  const mode: SlotMode = searchParams.get("mode") === "new" ? "new" : "continue";
  const [refreshKey, setRefreshKey] = useState(0);

  const slots = useMemo(() => {
    void refreshKey;
    return loadSaveRoot().slots;
  }, [refreshKey, ready]);

  const title =
    mode === "new"
      ? t(messages.slots.newTitle, locale)
      : t(messages.slots.continueTitle, locale);

  const handlePick = (index: SaveSlotIndex) => {
    const slot = slots[index]!;
    if (mode === "continue") {
      if (!isSlotOccupied(slot)) return;
      continueFromSlot(index);
      router.push("/adventure");
      return;
    }

    if (isSlotOccupied(slot)) {
      const ok = window.confirm(t(messages.slots.overwriteConfirm, locale));
      if (!ok) return;
    }
    prepareNewGameSlot(index);
    setRefreshKey((k) => k + 1);
    router.push("/select");
  };

  if (!ready) {
    return (
      <PageShell centered>
        <p className="font-pixel text-xs text-rpg-12">{t(messages.common.loading, locale)}</p>
      </PageShell>
    );
  }

  return (
    <PageShell centered className="gap-6">
      <header className="text-center">
        <h1 className="font-pixel text-base text-rpg-5 sm:text-lg">{title}</h1>
        {mode === "continue" && (
          <p className="mt-2 font-jp text-xs text-rpg-14">
            {t(messages.slots.continueHint, locale)}
          </p>
        )}
      </header>

      <div className="flex w-full max-w-md flex-col gap-3">
        {Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => {
          const index = i as SaveSlotIndex;
          const slot = slots[index]!;
          const occupied = isSlotOccupied(slot);
          const disabled = mode === "continue" && !occupied;

          return (
            <PixelPanel key={index} tone="dialog">
              <div className="flex flex-col gap-2">
                <p className="font-pixel text-[10px] text-rpg-8">
                  {formatMessage(t(messages.slots.slotLabel, locale), { n: i + 1 })}
                </p>
                <p className="font-jp text-sm text-rpg-5">{slotSummary(slot, locale)}</p>
                {occupied && slot.savedAt > 0 && (
                  <p className="font-jp text-[10px] text-rpg-14">
                    {formatMessage(t(messages.slots.lastSaved, locale), {
                      time: formatSavedAt(slot.savedAt, locale),
                    })}
                  </p>
                )}
                <PixelButton
                  variant={mode === "continue" && occupied ? "gold" : "default"}
                  className="w-full"
                  disabled={disabled}
                  onClick={() => handlePick(index)}
                >
                  {mode === "continue"
                    ? t(messages.home.continueAdventure, locale)
                    : t(messages.home.newGame, locale)}
                </PixelButton>
              </div>
            </PixelPanel>
          );
        })}
      </div>

      <PixelButton className="max-w-md" onClick={() => router.push("/")}>
        {t(messages.slots.backHome, locale)}
      </PixelButton>
    </PageShell>
  );
}

export default function SlotsPage() {
  return (
    <Suspense
      fallback={
        <PageShell centered>
          <p className="font-pixel text-xs text-rpg-12">…</p>
        </PageShell>
      }
    >
      <SlotsContent />
    </Suspense>
  );
}
