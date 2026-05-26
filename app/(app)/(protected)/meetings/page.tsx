/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/core/i18n";
import { auth } from "@/lib/core/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/core/seo";
import { db } from "@/lib/core/db";
import { listMeetings } from "@/lib/features/meetings";
import { listLabels } from "@/lib/features/labels";
import { listContacts } from "@/lib/features/contacts";
import { listTasks } from "@/lib/features/tasks";
import { MeetingsShell } from "@/components/features/meetings";
import type { AppLanguage } from "@/types/i18n";

export async function generateMetadata() {
  const t = await getTranslations("meetings");
  const locale = (await getLocale()) as AppLanguage;

  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
    path: "/meetings",
    locale: getSeoLocale(locale),
  });
}

export default async function MeetingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [meetings, labels, contacts, tasks, gcalIntegration] =
    await Promise.all([
      listMeetings(session.user.id),
      listLabels(session.user.id),
      listContacts(session.user.id),
      listTasks(session.user.id),
      db.integration.findFirst({
        where: { userId: session.user.id, provider: "google_calendar" },
        select: { id: true },
      }),
    ]);

  return (
    <MeetingsShell
      initialMeetings={meetings}
      availableLabels={labels}
      availableContacts={contacts}
      availableTasks={tasks}
      hasGoogleCalendar={gcalIntegration !== null}
    />
  );
}


