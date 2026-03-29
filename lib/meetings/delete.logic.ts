/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

/**
 * Deletes a meeting belonging to the given user (cascades participants).
 * Returns false if the meeting does not exist or belongs to a different user.
 */
export async function deleteMeeting(
  userId: string,
  meetingId: string,
): Promise<boolean> {
  const existing = await db.meeting.findUnique({
    where: { id: meetingId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) return false;

  await db.meeting.delete({ where: { id: meetingId } });
  return true;
}
