/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { MeetingRecord } from "./list.logic";

export interface UpdateMeetingInput {
  title?: string;
  scheduledAt?: Date;
  durationMin?: number | null;
  location?: string | null;
  agenda?: string | null;
  summary?: string | null;
  status?: string;
  /** Replaces the full participant list when provided. */
  participantContactIds?: string[];
}

/**
 * Updates an existing meeting. If participantContactIds is provided, the
 * existing participant set is replaced entirely (delete + recreate).
 * Returns null if the meeting does not exist or belongs to a different user.
 */
export async function updateMeeting(
  userId: string,
  meetingId: string,
  input: UpdateMeetingInput,
): Promise<MeetingRecord | null> {
  const existing = await db.meeting.findUnique({
    where: { id: meetingId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) return null;

  const { participantContactIds, ...fields } = input;

  const row = await db.meeting.update({
    where: { id: meetingId },
    data: {
      ...fields,
      ...(participantContactIds !== undefined && {
        participants: {
          deleteMany: {},
          create: participantContactIds.map((contactId) => ({ contactId })),
        },
      }),
    },
    include: {
      participants: {
        include: { contact: { select: { id: true, name: true } } },
      },
    },
  });

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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    participants: row.participants.map((p) => ({
      id: p.id,
      contactId: p.contactId,
      contactName: p.contact.name,
    })),
  };
}
