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
  labelIds?: string[];
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

  const labelIds =
    input.labelIds !== undefined
      ? await assertOwnedLabelIds(userId, input.labelIds)
      : undefined;

  const { participantContactIds, labelIds: _labelIds, ...fields } = input;

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
      ...(labelIds !== undefined && {
        labelLinks: {
          deleteMany: {},
          create: labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
    include: meetingInclude,
  });

  if (participantContactIds && participantContactIds.length > 0) {
    for (const contactId of participantContactIds) {
      logInteraction(contactId, "meeting", row.id);
    }
  }

  return toMeetingRecord(row);
}
