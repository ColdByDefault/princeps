/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/types/billing";
import { getRequestConfig } from "@/i18n/request";
import { listKnowledgeDocuments } from "@/lib/knowledge/list.logic";
import { getPersonalInfo } from "@/lib/knowledge/personal-info.logic";
import { KnowledgeTabs } from "@/components/knowledge";
import type { Metadata } from "next";
import { getMessage } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "knowledge.metadata.title", "Knowledge Base"),
    description: getMessage(
      messages,
      "knowledge.metadata.description",
      "Manage your private knowledge and personal information.",
    ),
  };
}

export default async function KnowledgePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { messages } = await getRequestConfig();

  const [rawDocuments, personalInfoFields, dbUser] = await Promise.all([
    listKnowledgeDocuments(session.user.id),
    getPersonalInfo(session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true },
    }),
  ]);

  const docLimit = getPlanLimits(dbUser?.tier ?? "free").knowledgeDocs;

  // Serialize dates for client
  const documents = rawDocuments.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <KnowledgeTabs
        messages={messages}
        initialDocuments={documents}
        initialPersonalInfo={personalInfoFields ?? {}}
        docLimit={docLimit}
      />
    </div>
  );
}
