/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { getTranslations, getLocale } from "@/lib/core/i18n";
import { requireSession } from "@/lib/core/auth/session";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { listReports, getToolFrequency } from "@/lib/features/reports";
import { ReportsShell } from "@/components/settings/reports";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("reports");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/reports",
    locale: getSeoLocale(locale),
  });
}

export default async function ReportsPage() {
  const session = await requireSession();

  

  const [reports, frequencyData] = await Promise.all([
    listReports(session.user.id),
    getToolFrequency(session.user.id),
  ]);

  return (
    <ReportsShell initialReports={reports} frequencyData={frequencyData} />
  );
}

