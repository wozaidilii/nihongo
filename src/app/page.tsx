"use client";

import { useRouter } from "next/navigation";
import { TitleCover } from "~/components/game/TitleCover";
import { PageShell } from "~/components/game/PageShell";
import { PixelButton } from "~/components/pixel/PixelButton";
import { PixelPanel } from "~/components/pixel/PixelPanel";
import { useGameReady } from "~/hooks/useGameReady";
import { useLocale } from "~/hooks/useLocale";
import { useGameStore } from "~/store/game";
import { getHeroClass } from "~/data/classes";
import { formatMessage, heroName, messages, t } from "~/i18n/messages";

export default function TitlePage() {
  const router = useRouter();
  const ready = useGameReady();
  const { locale } = useLocale();
  const classId = useGameStore((s) => s.classId);
  const level = useGameStore((s) => s.level);
  const hero = getHeroClass(classId);

  const hasSave = ready && !!hero;
  const heroLabel = hero ? heroName(hero.id, locale) : "";

  return (
    <PageShell centered className="gap-6 sm:gap-8">
      <TitleCover locale={locale} />

      <PixelPanel tone="dialog" className="relative z-10 w-full max-w-md">
        <div className="flex flex-col gap-4">
          {hasSave ? (
            <>
              <p className="font-jp text-sm text-rpg-13">
                {formatMessage(t(messages.home.welcomeBack, locale), {
                  name: heroLabel,
                  level,
                })}
              </p>
              <PixelButton
                variant="gold"
                className="w-full sm:w-auto"
                onClick={() => router.push("/adventure")}
              >
                {t(messages.home.continueAdventure, locale)}
              </PixelButton>
              <PixelButton
                className="w-full sm:w-auto"
                onClick={() => router.push("/select")}
              >
                {t(messages.home.reselectClass, locale)}
              </PixelButton>
            </>
          ) : (
            <>
              <p className="font-jp text-sm text-rpg-13">
                {t(messages.home.newPlayerHint, locale)}
              </p>
              <PixelButton
                variant="gold"
                className="w-full sm:w-auto"
                onClick={() => router.push("/select")}
              >
                {t(messages.home.startAdventure, locale)}
              </PixelButton>
            </>
          )}
        </div>
      </PixelPanel>

      <p className="relative z-10 px-2 text-center font-pixel text-[9px] text-rpg-15 sm:text-[10px]">
        {t(messages.home.browserTip, locale)}
      </p>
    </PageShell>
  );
}
