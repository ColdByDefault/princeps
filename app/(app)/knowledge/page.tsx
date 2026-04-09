/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
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

  const documents = await listKnowledgeDocuments(session.user.id);

  return <KnowledgePageClient initialDocuments={documents} />;
}
