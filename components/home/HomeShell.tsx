/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import type { WeatherSnapshot } from "@/lib/weather/fetch";

type HomeShellProps = {
  weather: WeatherSnapshot | null;
  greetingTitle: string;
};

export function HomeShell({ weather, greetingTitle }: HomeShellProps) {
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
    </div>
  );
}
