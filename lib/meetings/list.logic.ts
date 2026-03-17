/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */ 

import "server-only";

import { prisma } from "@/lib/db";
import {
  meetingListQuerySchema,
  meetingListSelect,
} from "@/lib/meetings/shared.logic";

export async function listMeetings(
  userId: string,
  input: Record<string, string | undefined>,
) {
  const query = meetingListQuerySchema.parse(input);

  return prisma.meeting.findMany({
    where: {
      userId,
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
    take: query.limit,
    select: meetingListSelect,
  });
}
