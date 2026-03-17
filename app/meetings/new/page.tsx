/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MeetingCreateForm from "@/components/meetings/MeetingCreateForm";
import { MeetingWorkspaceShell } from "@/components/meetings/shared";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { defineSEO, getSeoLocale } from "@/lib/seo";

export async function generateMetadata() {
  const { language, messages } = await getRequestConfig();

  return defineSEO({
    title: getMessage(messages, "meetings.new.metadata.title", "New Meeting"),
    description: getMessage(
      messages,
      "meetings.new.metadata.description",
      "Create a new meeting record with objective, schedule, participants, and preparation notes.",
    ),
    path: "/meetings/new",
    locale: getSeoLocale(language),
  });
}

export default async function NewMeetingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { messages } = await getRequestConfig();

  return (
    <MeetingWorkspaceShell
      eyebrow={getMessage(messages, "meetings.new.eyebrow", "Create meeting")}
      title={getMessage(
        messages,
        "meetings.new.title",
        "Capture the next conversation before it happens.",
      )}
      description={getMessage(
        messages,
        "meetings.new.description",
        "Start with the essentials. You can add more structure and follow-up detail after the meeting.",
      )}
      messages={messages}
      secondaryHref="/meetings"
      secondaryLabel={getMessage(
        messages,
        "meetings.nav.backToMeetings",
        "Back to meetings",
      )}
    >
      <MeetingCreateForm messages={messages} />
    </MeetingWorkspaceShell>
  );
}
