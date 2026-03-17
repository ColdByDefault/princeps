/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  meetingDetailSelect,
  validateMeetingId,
} from "@/lib/meetings/shared.logic";

export async function getMeeting(userId: string, meetingId: string) {
  const validMeetingId = validateMeetingId(meetingId);

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: validMeetingId,
      userId,
    },
    select: meetingDetailSelect,
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  return meeting;
}
