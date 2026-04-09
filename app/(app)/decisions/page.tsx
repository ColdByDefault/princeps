/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listDecisions } from "@/lib/decisions";
import { listLabels } from "@/lib/labels";
import { listMeetings } from "@/lib/meetings";
import { DecisionsShell } from "@/components/decisions";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("decisions");
  const locale = (await getLocale()) as AppLanguage;
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/decisions",
    locale: getSeoLocale(locale),
  });
}

export default async function DecisionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [decisions, labels, meetings] = await Promise.all([
    listDecisions(session.user.id),
    listLabels(session.user.id),
    listMeetings(session.user.id),
  ]);

  return (
    <DecisionsShell
      initialDecisions={decisions}
      availableLabels={labels}
      availableMeetings={meetings}
    />
  );
}
