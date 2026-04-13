/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
import { createCalendarEvent } from "@/lib/integrations/google-calendar/events";
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

  // If requested, push the event to Google Calendar and stamp googleEventId back.
  if (input.pushToGoogle) {
    try {
      const googleEventId = await createCalendarEvent(userId, {
        title: input.title,
        scheduledAt: new Date(input.scheduledAt),
        durationMin: input.durationMin ?? null,
        location: input.location ?? null,
        agenda: input.agenda ?? null,
      });

      const updated = await db.meeting.update({
        where: { id: row.id },
        data: { googleEventId, source: "google_calendar" },
        select: MEETING_SELECT,
      });

      return toMeetingRecord(updated);
    } catch {
      // Best-effort: Princeps meeting was created; Google push failed silently.
    }
  }

  return toMeetingRecord(row);
}
