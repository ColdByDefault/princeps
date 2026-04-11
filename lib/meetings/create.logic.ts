/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
import type { CreateMeetingInput } from "./schemas";
import type { MeetingRecord } from "@/types/api";

export async function createMeeting(
  userId: string,
  input: CreateMeetingInput,
): Promise<MeetingRecord> {
  const row = await db.meeting.create({
    data: {
      userId,
      title: input.title,
      scheduledAt: new Date(input.scheduledAt),
      durationMin: input.durationMin ?? null,
      location: input.location ?? null,
      agenda: input.agenda ?? null,
      summary: input.summary ?? null,
      ...(input.source ? { source: input.source } : {}),
      ...(input.labelIds?.length
        ? {
            labelLinks: {
              create: input.labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
      ...(input.participantContactIds?.length
        ? {
            participants: {
              create: input.participantContactIds.map((contactId) => ({
                contactId,
              })),
            },
          }
        : {}),
    },
    select: MEETING_SELECT,
  });

  return toMeetingRecord(row);
}
