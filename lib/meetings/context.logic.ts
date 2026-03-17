/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";

export async function getMeetingContext(userId: string) {
  const [meetings, actionItems, decisions] = await Promise.all([
    prisma.meeting.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { scheduledAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        objective: true,
        summary: true,
        nextSteps: true,
        status: true,
        scheduledAt: true,
      },
    }),
    prisma.meetingActionItem.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { dueAt: "asc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        assigneeName: true,
        dueAt: true,
      },
    }),
    prisma.decision.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { decidedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        outcome: true,
        rationale: true,
      },
    }),
  ]);

  return {
    actionItems,
    decisions,
    meetings,
  };
}
