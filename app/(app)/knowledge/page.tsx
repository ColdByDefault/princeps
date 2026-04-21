/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listKnowledgeDocuments } from "@/lib/knowledge";
import { KnowledgePageClient } from "@/components/knowledge";
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
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

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
