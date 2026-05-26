/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 */

import "server-only";

import { getTranslations, getLocale } from "@/lib/core/i18n";
import { requireSession } from "@/lib/core/auth/session";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { listReadingItems } from "@/lib/features/reading-queue";
import { ReadingQueueShell } from "@/components/features/reading-queue";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("readingQueue");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/reading-queue",
    locale: getSeoLocale(locale),
  });
}

export default async function ReadingQueuePage() {
  const session = await requireSession();
  

  const items = await listReadingItems(session.user.id);

  return <ReadingQueueShell initialItems={items} />;
}

