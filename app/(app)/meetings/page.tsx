/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRequestConfig } from "@/i18n/request";
import { listMeetings } from "@/lib/meetings/list.logic";
import { listContacts } from "@/lib/contacts/list.logic";
import { listLabels } from "@/lib/labels/list.logic";
import { MeetingsView } from "@/components/meetings";
import type { Metadata } from "next";
import { getMessage } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getRequestConfig();
  return {
    title: getMessage(messages, "meetings.metadata.title", "Meetings"),
    description: getMessage(
      messages,
      "meetings.metadata.description",
      "Schedule and review your meetings with context and outcomes.",
    ),
  };
}

export default async function MeetingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { messages } = await getRequestConfig();

  const [rawMeetings, rawContacts, labels] = await Promise.all([
    listMeetings(session.user.id),
    listContacts(session.user.id),
    listLabels(session.user.id),
  ]);

  const meetings = rawMeetings.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    participants: m.participants,
  }));

  const contacts = rawContacts.map((c) => ({
    ...c,
    lastContact: c.lastContact ? c.lastContact.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <MeetingsView
        messages={messages}
        initialMeetings={meetings}
        contacts={contacts}
        availableLabels={labels}
      />
    </div>
  );
}
