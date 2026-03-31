/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { logInteraction } from "@/lib/contacts/log-interaction";
import type { MeetingParticipantRecord, MeetingRecord } from "./list.logic";

const meetingInclude = {
  participants: {
    include: { contact: { select: { id: true, name: true } } },
  },
} satisfies Prisma.MeetingInclude;

type MeetingWithParticipants = Prisma.MeetingGetPayload<{
  include: typeof meetingInclude;
}>;

export interface CreateMeetingInput {
  title: string;
  scheduledAt: Date;
  durationMin?: number | null;
  location?: string | null;
  agenda?: string | null;
  participantContactIds?: string[];
}

/**
 * Creates a new meeting with optional participants (must be existing contacts
 * belonging to the same user).
 */
export async function createMeeting(
  userId: string,
  input: CreateMeetingInput,
): Promise<MeetingRecord> {
  const hasParticipants =
    input.participantContactIds && input.participantContactIds.length > 0;

  const row = await db.meeting.create({
    data: {
      userId,
      title: input.title,
      scheduledAt: input.scheduledAt,
      durationMin: input.durationMin ?? null,
      location: input.location ?? null,
      agenda: input.agenda ?? null,
      status: "upcoming",
      ...(hasParticipants
        ? {
            participants: {
              create: input.participantContactIds!.map((contactId) => ({
                contactId,
              })),
            },
          }
        : {}),
    },
    include: meetingInclude,
  });

  if (input.participantContactIds && input.participantContactIds.length > 0) {
    for (const contactId of input.participantContactIds) {
      logInteraction(contactId, "meeting", row.id);
    }
  }

  return toRecord(row);
}

function toRecord(row: MeetingWithParticipants): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt,
    durationMin: row.durationMin,
    location: row.location,
    agenda: row.agenda,
    summary: row.summary,
    prepPack: row.prepPack,
    status: row.status,
    googleEventId: row.googleEventId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    participants: (
      row.participants as MeetingWithParticipants["participants"]
    ).map(
      (p): MeetingParticipantRecord => ({
        id: p.id,
        contactId: p.contactId,
        contactName: p.contact.name,
      }),
    ),
  };
}
