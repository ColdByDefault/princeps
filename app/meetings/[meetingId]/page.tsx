/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import MeetingDetailView from "@/components/meetings/MeetingDetailView";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { getMeeting } from "@/lib/meetings/get.logic";
import { defineSEO, getSeoLocale } from "@/lib/seo";
import { type MeetingDetail } from "@/types/meetings";

interface MeetingDetailPageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function generateMetadata({ params }: MeetingDetailPageProps) {
  const { messages, language } = await getRequestConfig();
  const { meetingId } = await params;

  return defineSEO({
    title: getMessage(messages, "meetings.metadata.title", "Meetings"),
    description: getMessage(
      messages,
      "meetings.detail.metadata.description",
      "Review preparation, participants, outcomes, action items, and decisions for this meeting.",
    ),
    path: `/meetings/${meetingId}`,
    locale: getSeoLocale(language),
  });
}

export default async function MeetingDetailPage({
  params,
}: MeetingDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { meetingId } = await params;
  const { language, messages } = await getRequestConfig();

  const meeting = (await getMeeting(session.user.id, meetingId).catch(
    (error: unknown) => {
      if (error instanceof Error && error.message === "Meeting not found") {
        notFound();
      }

      throw error;
    },
  )) as MeetingDetail;

  return (
    <MeetingDetailView
      language={language}
      meeting={meeting}
      messages={messages}
    />
  );
}
