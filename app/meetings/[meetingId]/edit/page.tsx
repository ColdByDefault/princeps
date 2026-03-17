/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import MeetingCreateForm from "@/components/meetings/MeetingCreateForm";
import { MeetingWorkspaceShell } from "@/components/meetings/shared";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { getMeeting } from "@/lib/meetings/get.logic";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import {
  type MeetingDetail,
  type MeetingFormInitialValues,
} from "@/types/meetings";

interface EditMeetingPageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

function formatDateTimeLocal(value: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);

  return localDate.toISOString().slice(0, 16);
}

function toInitialValues(meeting: MeetingDetail): MeetingFormInitialValues {
  return {
    title: meeting.title,
    objective: meeting.objective ?? "",
    scheduledAt: formatDateTimeLocal(meeting.scheduledAt),
    durationMinutes: meeting.durationMinutes
      ? String(meeting.durationMinutes)
      : "",
    location: meeting.location ?? "",
    prepNotes: meeting.prepNotes ?? "",
    participants: meeting.participants
      .map((participant) => participant.name)
      .join("\n"),
    summary: meeting.summary ?? "",
    nextSteps: meeting.nextSteps ?? "",
    actionItems: meeting.actionItems.map((item) => item.title).join("\n"),
    decisions: meeting.decisions.map((decision) => decision.title).join("\n"),
  };
}

export async function generateMetadata({ params }: EditMeetingPageProps) {
  const { language, messages } = await getRequestConfig();
  const { meetingId } = await params;

  return defineSEO({
    title: getMessage(messages, "meetings.edit.metadata.title", "Edit Meeting"),
    description: getMessage(
      messages,
      "meetings.edit.metadata.description",
      "Update the schedule, participants, and preparation details for this meeting.",
    ),
    path: `/meetings/${meetingId}/edit`,
    locale: getSeoLocale(language),
  });
}

export default async function EditMeetingPage({
  params,
}: EditMeetingPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { meetingId } = await params;
  const { messages } = await getRequestConfig();

  const meeting = (await getMeeting(session.user.id, meetingId).catch(
    (error: unknown) => {
      if (error instanceof Error && error.message === "Meeting not found") {
        notFound();
      }

      throw error;
    },
  )) as MeetingDetail;

  return (
    <MeetingWorkspaceShell
      eyebrow={getMessage(messages, "meetings.edit.eyebrow", "Edit meeting")}
      title={getMessage(
        messages,
        "meetings.edit.title",
        "Refine the meeting record before and after the conversation.",
      )}
      description={getMessage(
        messages,
        "meetings.edit.description",
        "Adjust the essentials, sharpen the preparation, and keep the meeting record current.",
      )}
      messages={messages}
      secondaryHref={`/meetings/${meeting.id}`}
      secondaryLabel={getMessage(
        messages,
        "meetings.nav.backToDetail",
        "Back to meeting",
      )}
    >
      <MeetingCreateForm
        initialValues={toInitialValues(meeting)}
        meetingId={meeting.id}
        messages={messages}
        mode="edit"
      />
    </MeetingWorkspaceShell>
  );
}
