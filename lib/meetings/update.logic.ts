/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */ 

import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  meetingDetailSelect,
  normalizeUpdateMeetingInput,
  requireMeetingForUser,
  updateMeetingInputSchema,
  validateMeetingId,
} from "@/lib/meetings/shared.logic";

export async function updateMeeting(
  userId: string,
  meetingId: string,
  input: unknown,
) {
  const validMeetingId = validateMeetingId(meetingId);
  const parsedInput = updateMeetingInputSchema.parse(input);
  const normalizedInput = normalizeUpdateMeetingInput(parsedInput);

  await requireMeetingForUser(userId, validMeetingId);

  const data: Prisma.MeetingUpdateInput = {};

  if (normalizedInput.title !== undefined) {
    data.title = normalizedInput.title;
  }

  if (normalizedInput.objective !== undefined) {
    data.objective = normalizedInput.objective;
  }

  if (normalizedInput.scheduledAt !== undefined) {
    data.scheduledAt = normalizedInput.scheduledAt;
  }

  if (normalizedInput.durationMinutes !== undefined) {
    data.durationMinutes = normalizedInput.durationMinutes;
  }

  if (normalizedInput.location !== undefined) {
    data.location = normalizedInput.location;
  }

  if (normalizedInput.status !== undefined) {
    data.status = normalizedInput.status;
  }

  if (normalizedInput.prepNotes !== undefined) {
    data.prepNotes = normalizedInput.prepNotes;
  }

  if (normalizedInput.prepBrief !== undefined) {
    data.prepBrief = normalizedInput.prepBrief;
  }

  if (normalizedInput.summary !== undefined) {
    data.summary = normalizedInput.summary;
  }

  if (normalizedInput.nextSteps !== undefined) {
    data.nextSteps = normalizedInput.nextSteps;
  }

  if (normalizedInput.participants !== undefined) {
    data.participants = {
      deleteMany: {},
      create: normalizedInput.participants,
    };
  }

  if (normalizedInput.actionItems !== undefined) {
    data.actionItems = {
      deleteMany: {},
      create: normalizedInput.actionItems.map((item) => ({
        ...item,
        userId,
      })),
    };
  }

  if (normalizedInput.decisions !== undefined) {
    data.decisions = {
      deleteMany: {},
      create: normalizedInput.decisions.map((decision) => ({
        ...decision,
        userId,
      })),
    };
  }

  return prisma.meeting.update({
    where: {
      id: validMeetingId,
    },
    data,
    select: meetingDetailSelect,
  });
}
