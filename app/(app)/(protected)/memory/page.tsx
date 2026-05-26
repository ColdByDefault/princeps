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
import { listMemoryEntries } from "@/lib/features/memory";
import { MemoryShell } from "@/components/features/memory";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("memory");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/memory",
    locale: getSeoLocale(locale),
  });
}

export default async function MemoryPage() {
  const session = await requireSession();
  

  const entries = await listMemoryEntries(session.user.id);

  return <MemoryShell initialEntries={entries} />;
}

