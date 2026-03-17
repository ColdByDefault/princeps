/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  createMeetingInputSchema,
  meetingDetailSelect,
  normalizeCreateMeetingInput,
} from "@/lib/meetings/shared.logic";

export async function createMeeting(userId: string, input: unknown) {
  const parsedInput = createMeetingInputSchema.parse(input);
  const normalizedInput = normalizeCreateMeetingInput(parsedInput);

  return prisma.meeting.create({
    data: {
      userId,
      title: normalizedInput.title,
      objective: normalizedInput.objective,
      scheduledAt: normalizedInput.scheduledAt,
      durationMinutes: normalizedInput.durationMinutes,
      location: normalizedInput.location,
      status: normalizedInput.status,
      prepNotes: normalizedInput.prepNotes,
      prepBrief: normalizedInput.prepBrief,
      summary: normalizedInput.summary,
      nextSteps: normalizedInput.nextSteps,
      participants: {
        create: normalizedInput.participants,
      },
      actionItems: {
        create: normalizedInput.actionItems.map((item) => ({
          ...item,
          userId,
        })),
      },
      decisions: {
        create: normalizedInput.decisions.map((decision) => ({
          ...decision,
          userId,
        })),
      },
    },
    select: meetingDetailSelect,
  });
}
