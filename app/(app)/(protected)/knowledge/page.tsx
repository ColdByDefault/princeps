/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { getTranslations, getLocale } from "@/lib/core/i18n";
import { requireSession } from "@/lib/core/auth/session";
import { db } from "@/lib/core/db";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { listKnowledgeDocuments } from "@/lib/features/knowledge";
import { KnowledgePageClient } from "@/components/features/knowledge";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("knowledge");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/knowledge",
    locale: getSeoLocale(locale),
  });
}

export default async function KnowledgePage() {
  const session = await requireSession();

  

  const [documents, driveIntegration] = await Promise.all([
    listKnowledgeDocuments(session.user.id),
    db.integration.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: "google_drive",
        },
      },
      select: { id: true },
    }),
  ]);

  return (
    <KnowledgePageClient
      initialDocuments={documents}
      driveConnected={driveIntegration !== null}
    />
  );
}

