/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { BriefingCard } from "./BriefingCard";
import type { WeatherSnapshot } from "@/lib/weather/types";
import type { BriefingRecord } from "@/types/api";

type HomeShellProps = {
  weather: WeatherSnapshot | null;
  greetingTitle: string;
  initialBriefing: BriefingRecord | null;
  autoBriefingEnabled: boolean;
};

export function HomeShell({
  weather,
  greetingTitle,
  initialBriefing,
  autoBriefingEnabled,
}: HomeShellProps) {
  const t = useTranslations("home");

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16 gap-6">
      {/* Static time-based greeting */}
      <p className="text-2xl font-bold text-foreground text-center">
        {greetingTitle}
      </p>

      {/* Weather widget */}
      {weather ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <span
            className="text-4xl"
            role="img"
            aria-label={weather.conditionLabel}
          >
            {weather.conditionEmoji}
          </span>
          <p className="text-2xl font-semibold text-foreground">
            {weather.temperatureCelsius}°C
          </p>
          <p className="text-sm text-muted-foreground">
            {weather.conditionLabel}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {t("weather.location")}: {weather.location}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/50">
          {t("weather.noWeather")}
        </p>
      )}

      {/* Briefing card — always shown; content gated by autoBriefingEnabled */}
      <BriefingCard
        initialBriefing={initialBriefing}
        autoBriefingEnabled={autoBriefingEnabled}
      />
    </div>
  );
}
