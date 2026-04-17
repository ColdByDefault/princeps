/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { getBriefing } from "@/lib/briefings";
import { getUserPreferences } from "@/lib/settings/user-preferences.logic";
import { BriefingShell } from "@/components/briefings";
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

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
