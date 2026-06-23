"use client";

import { useRouter } from "next/navigation";
import { TitleCover } from "~/components/game/TitleCover";
import { PageShell } from "~/components/game/PageShell";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { hasAnyOccupiedSlot } from "~/store/game";
import { messages, t } from "~/i18n/messages";

export default function TitlePage() {
  const router = useRouter();
  const ready = useGameReady();
  const { locale } = useLocale();

  const hasSave = ready && hasAnyOccupiedSlot();

  return (
    <PageShell centered className="gap-6 sm:gap-8">
      <TitleCover locale={locale} />

      <PixelPanel tone="dialog" className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col gap-3">
          <PixelButton
            variant="gold"
            className="w-full"
            disabled={!hasSave}
            onClick={() => router.push("/slots?mode=continue")}
          >
            {t(messages.home.continueAdventure, locale)}
          </PixelButton>

          <PixelButton
            className="w-full"
            onClick={() => router.push("/slots?mode=new")}
          >
            {t(messages.home.newGame, locale)}
          </PixelButton>

          <PixelButton className="w-full" onClick={() => router.push("/codex")}>
            {t(messages.home.openCodex, locale)}
          </PixelButton>
        </div>
      </PixelPanel>

      <p className="relative z-10 px-2 text-center font-pixel text-[9px] text-rpg-15 sm:text-[10px]">
        {t(messages.home.browserTip, locale)}
      </p>
    </PageShell>
  );
}
