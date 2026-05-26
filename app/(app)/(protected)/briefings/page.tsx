/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import "server-only";

import { getTranslations, getLocale } from "@/lib/core/i18n";
import { requireSession } from "@/lib/core/auth/session";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { getBriefing } from "@/lib/features/briefings";
import { getUserPreferences } from "@/lib/platform/settings/user-preferences.logic";
import { BriefingShell } from "@/components/features/briefings";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("briefings");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/briefings",
    locale: getSeoLocale(locale),
  });
}

export default async function BriefingsPage() {
  const session = await requireSession();
  

  const [briefing, prefs] = await Promise.all([
    getBriefing(session.user.id),
    getUserPreferences(session.user.id),
  ]);

  return (
    <BriefingShell
      initialBriefing={briefing}
      autoBriefingEnabled={prefs.autoBriefingEnabled !== false}
    />
  );
}


