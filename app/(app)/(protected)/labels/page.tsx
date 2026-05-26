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
import { listLabels } from "@/lib/features/labels";
import { LabelsShell } from "@/components/settings/labels";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("labels");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/labels",
    locale: getSeoLocale(locale),
  });
}

export default async function LabelsPage() {
  const session = await requireSession();
  

  const labels = await listLabels(session.user.id);

  return <LabelsShell initialLabels={labels} />;
}

