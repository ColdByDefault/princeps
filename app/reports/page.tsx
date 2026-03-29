/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listReports } from "@/lib/reports/list.logic";
import { ReportsView } from "@/components/reports";
import type { Metadata } from "next";
import { getMessage } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "reports.metadata.title", "Assistant Reports"),
    description: getMessage(
      messages,
      "reports.metadata.description",
      "A log of actions performed by the assistant on your behalf.",
    ),
  };
}

export default async function ReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { messages } = await getRequestConfig();

  const rawReports = await listReports(session.user.id);

  const reports = rawReports.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <ReportsView messages={messages} reports={reports} />
    </div>
  );
}
