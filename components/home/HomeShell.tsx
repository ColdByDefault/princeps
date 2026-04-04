/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { useNotifications } from "@/hooks/use-notifications";
import type { WeatherSnapshot } from "@/lib/weather/fetch";

type HomeShellProps = {
  weather: WeatherSnapshot | null;
};

export function HomeShell({ weather }: HomeShellProps) {
  const t = useTranslations("home");
  const { notifications } = useNotifications();

  const todayGreeting = notifications.find(
    (n) => n.category === "daily_greeting",
  );

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16 gap-6">
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

      {/* Daily greeting from assistant */}
      {todayGreeting && (
        <p className="max-w-md text-center text-base text-muted-foreground leading-relaxed">
          {todayGreeting.body}
        </p>
      )}

      {!todayGreeting && (
        <p className="text-lg text-muted-foreground">{t("welcome")}</p>
      )}
    </div>
  );
}
