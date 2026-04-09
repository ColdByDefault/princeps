/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "@/lib/i18n";
import { auth } from "@/lib/auth/auth";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { listMeetings } from "@/lib/meetings";
import { listLabels } from "@/lib/labels";
import { listContacts } from "@/lib/contacts";
import { listTasks } from "@/lib/tasks";
import { MeetingsShell } from "@/components/meetings";
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

  const [meetings, labels, contacts, tasks] = await Promise.all([
    listMeetings(session.user.id),
    listLabels(session.user.id),
    listContacts(session.user.id),
    listTasks(session.user.id),
  ]);

  return (
    <MeetingsShell
      initialMeetings={meetings}
      availableLabels={labels}
      availableContacts={contacts}
      availableTasks={tasks}
    />
  );
}
