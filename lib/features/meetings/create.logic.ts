/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { db } from "@/lib/core/db";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
import { createCalendarEvent } from "@/lib/platform/integrations/google-calendar/events";
import type { CreateMeetingInput } from "./schemas";
import type { MeetingRecord } from "@/types/api";

export async function createMeeting(
  userId: string,
  input: CreateMeetingInput,
): Promise<MeetingRecord> {
  const labelIds = uniqueIds(input.labelIds);
  const participantContactIds = uniqueIds(input.participantContactIds);

  const row = await db.meeting.create({
    data: {
      userId,
      title: input.title,
      scheduledAt: new Date(input.scheduledAt),
      durationMin: input.durationMin ?? null,
      location: input.location ?? null,
      ...(input.status ? { status: input.status } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      agenda: input.agenda ?? null,
      summary: input.summary ?? null,
      ...(input.source ? { source: input.source } : {}),
      ...(labelIds.length
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
      ...(participantContactIds.length
        ? {
            participants: {
              create: participantContactIds.map((contactId) => ({
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

function uniqueIds(ids: string[] | undefined): string[] {
  return ids ? [...new Set(ids)] : [];
}
