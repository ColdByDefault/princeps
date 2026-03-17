/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  requireMeetingForUser,
  validateMeetingId,
} from "@/lib/meetings/shared.logic";

export async function deleteMeeting(userId: string, meetingId: string) {
  const validMeetingId = validateMeetingId(meetingId);

  await requireMeetingForUser(userId, validMeetingId);

  await prisma.meeting.delete({
    where: {
      id: validMeetingId,
    },
  });

  return { success: true };
}
