/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { db } from "@/lib/db";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "@/lib/integrations/google-calendar/events";
import type { UpdateMeetingInput } from "./schemas";
import type { MeetingRecord } from "@/types/api";

export type UpdateMeetingResult =
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function updateMeeting(
  meetingId: string,
  userId: string,
  input: UpdateMeetingInput,
): Promise<UpdateMeetingResult> {
  try {
    const labelIds =
      input.labelIds !== undefined ? uniqueIds(input.labelIds) : undefined;
    const participantContactIds =
      input.participantContactIds !== undefined
        ? uniqueIds(input.participantContactIds)
        : undefined;
    const linkedTaskIds =
      input.linkedTaskIds !== undefined
        ? uniqueIds(input.linkedTaskIds)
        : undefined;

    // Build the batch up-front so $transaction never calls into an already-running query.
    const batch = [
      db.meeting.update({
        where: { id: meetingId, userId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.scheduledAt !== undefined && {
            scheduledAt: new Date(input.scheduledAt),
          }),
          ...(input.durationMin !== undefined && {
            durationMin: input.durationMin,
          }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.kind !== undefined && { kind: input.kind }),
          ...(input.agenda !== undefined && { agenda: input.agenda }),
          ...(input.summary !== undefined && { summary: input.summary }),
          ...(labelIds !== undefined && {
            labelLinks: {
              deleteMany: {},
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }),
          ...(participantContactIds !== undefined && {
            participants: {
              deleteMany: {},
              create: participantContactIds.map((contactId) => ({
                contactId,
              })),
            },
          }),
        },
      }),
      ...(linkedTaskIds !== undefined
        ? [
            // Unlink all tasks currently attached to this meeting
            db.task.updateMany({
              where: { meetingId, userId },
              data: { meetingId: null },
            }),
            // Link the new set (scoped to this user for safety)
            ...(linkedTaskIds.length > 0
              ? [
                  db.task.updateMany({
                    where: { id: { in: linkedTaskIds }, userId },
                    data: { meetingId },
                  }),
                ]
              : []),
          ]
        : []),
    ];

    await db.$transaction(batch);

    const row = await db.meeting.findUniqueOrThrow({
      where: { id: meetingId },
      select: MEETING_SELECT,
    });

    const meeting = toMeetingRecord(row);

    // Auto-sync changes to Google Calendar for events already linked there.
    if (meeting.googleEventId) {
      try {
        await updateCalendarEvent(userId, meeting.googleEventId, {
          title: meeting.title,
          scheduledAt: meeting.scheduledAt,
          durationMin: meeting.durationMin,
          location: meeting.location,
          agenda: meeting.agenda,
        });
      } catch {
        // Best-effort: Princeps update succeeded; Google push failed silently.
      }
    } else if (input.pushToGoogle) {
      // Meeting not yet in Google Calendar — create a new event and stamp back the ID.
      try {
        const googleEventId = await createCalendarEvent(userId, {
          title: meeting.title,
          scheduledAt: new Date(meeting.scheduledAt),
          durationMin: meeting.durationMin,
          location: meeting.location,
          agenda: meeting.agenda,
        });
        const updated = await db.meeting.update({
          where: { id: meetingId },
          data: { googleEventId, source: "google_calendar" },
          select: MEETING_SELECT,
        });
        return { ok: true, meeting: toMeetingRecord(updated) };
      } catch {
        // Best-effort: Princeps update succeeded; Google push failed silently.
      }
    }

    return { ok: true, meeting };
  } catch {
    return { ok: false, notFound: true };
  }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
