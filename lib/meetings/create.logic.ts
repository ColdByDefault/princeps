/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { logInteraction } from "@/lib/contacts/log-interaction";
import { assertOwnedLabelIds } from "@/lib/labels/shared.logic";
import type { MeetingRecord } from "./list.logic";
import { meetingInclude, toMeetingRecord } from "./shared.logic";

export interface CreateMeetingInput {
  title: string;
  scheduledAt: Date;
  durationMin?: number | null;
  location?: string | null;
  agenda?: string | null;
  participantContactIds?: string[];
  labelIds?: string[];
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
  const labelIds = await assertOwnedLabelIds(userId, input.labelIds);

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
      ...(labelIds.length > 0
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
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

  return toMeetingRecord(row);
}
