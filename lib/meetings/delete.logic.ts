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
import { deleteCalendarEvent } from "@/lib/integrations/google-calendar/events";

export async function deleteMeeting(
  meetingId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  // Fetch the googleEventId before deletion — the row won't exist after.
  const existing = await db.meeting.findFirst({
    where: { id: meetingId, userId },
    select: { googleEventId: true },
  });

  const { count } = await db.meeting.deleteMany({
    where: { id: meetingId, userId },
  });

  if (count > 0 && existing?.googleEventId) {
    try {
      await deleteCalendarEvent(userId, existing.googleEventId);
    } catch {
      // Best-effort: Princeps deletion succeeded; Google push failed silently.
    }
  }

  return { ok: count > 0 };
}
