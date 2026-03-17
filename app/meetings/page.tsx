/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MeetingListView from "@/components/meetings/MeetingListView";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { listMeetings } from "@/lib/meetings/list.logic";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { type MeetingListItem } from "@/types/meetings";

export async function generateMetadata() {
  const { language, messages } = await getRequestConfig();

  return defineSEO({
    title: getMessage(messages, "meetings.metadata.title", "Meetings"),
    description: getMessage(
      messages,
      "meetings.metadata.description",
      "Prepare, review, and follow through on your meetings inside a structured private workspace.",
    ),
    path: "/meetings",
    locale: getSeoLocale(language),
  });
}

export default async function MeetingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { language, messages } = await getRequestConfig();
  const meetings = (await listMeetings(session.user.id, {
    limit: "24",
  })) as MeetingListItem[];

  return (
    <MeetingListView
      language={language}
      meetings={meetings}
      messages={messages}
    />
  );
}
