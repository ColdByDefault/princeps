/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listDecisions } from "@/lib/decisions/list.logic";
import { DecisionsView } from "@/components/decisions";
import type { Metadata } from "next";
import { getMessage } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "decisions.metadata.title", "Decisions"),
    description: getMessage(
      messages,
      "decisions.metadata.description",
      "Log key decisions with rationale, outcome, and status.",
    ),
  };
}

export default async function DecisionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { messages } = await getRequestConfig();

  const rawDecisions = await listDecisions(session.user.id);

  const decisions = rawDecisions.map((d) => ({
    ...d,
    decidedAt: d.decidedAt ? d.decidedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <DecisionsView messages={messages} initialDecisions={decisions} />
    </div>
  );
}
