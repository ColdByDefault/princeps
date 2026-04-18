/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { fetchWeather } from "@/lib/weather";
import { getUserPreferences } from "@/lib/settings/user-preferences.logic";
import { getBriefing } from "@/lib/briefings";
import { HomeShell } from "@/components/home";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/home",
    locale: getSeoLocale(locale),
  });
}

function buildGreetingTitle(
  name: string,
  timezone: string,
  lang: string,
): string {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(hour, 10);

  const period: "morning" | "afternoon" | "evening" =
    h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";

  const displayName = name.trim().split(" ")[0] ?? name;

  if (lang === "de") {
    const phrases = {
      morning: "Guten Morgen",
      afternoon: "Guten Tag",
      evening: "Guten Abend",
    };
    return `${phrases[period]}, ${displayName}!`;
  }
  const phrases = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
  };
  return `${phrases[period]}, ${displayName}!`;
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const timezone = session.user.timezone ?? "UTC";
  const prefs = (session.user.preferences ?? {}) as unknown as Record<
    string,
    unknown
  >;
  const lang = typeof prefs.language === "string" ? prefs.language : "de";
  const locationData =
    typeof prefs.location === "string" &&
    typeof prefs.locationLat === "number" &&
    typeof prefs.locationLon === "number"
      ? {
          label: prefs.location,
          lat: prefs.locationLat as number,
          lon: prefs.locationLon as number,
        }
      : null;
  const name = session.user.name ?? "";

  const userPrefs = await getUserPreferences(session.user.id);
  const autoBriefingEnabled = userPrefs.autoBriefingEnabled !== false;

  const [weather, initialBriefing] = await Promise.all([
    fetchWeather(timezone, locationData),
    // Only fetch the cached briefing when auto is on; when off the card shows the
    // "turn it on" notice regardless of what's stored in the DB.
    autoBriefingEnabled ? getBriefing(session.user.id) : Promise.resolve(null),
  ]);

  const greetingTitle = buildGreetingTitle(name || "there", timezone, lang);

  return (
    <HomeShell
      weather={weather}
      greetingTitle={greetingTitle}
      initialBriefing={initialBriefing}
      autoBriefingEnabled={autoBriefingEnabled}
    />
  );
}
