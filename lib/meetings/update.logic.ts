/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
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
  const row = await db.meeting
    .update({
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
        ...(input.labelIds !== undefined && {
          labelLinks: {
            deleteMany: {},
            create: input.labelIds.map((labelId) => ({ labelId })),
          },
        }),
      },
      select: MEETING_SELECT,
    })
    .catch(() => null);

  if (!row) return { ok: false, notFound: true };
  return { ok: true, meeting: toMeetingRecord(row) };
}
