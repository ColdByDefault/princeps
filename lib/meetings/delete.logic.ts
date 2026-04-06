/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteMeeting(
  meetingId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.meeting.deleteMany({
    where: { id: meetingId, userId },
  });
  return { ok: count > 0 };
}
