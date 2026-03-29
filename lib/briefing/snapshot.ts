/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export type BriefingSnapshot = {
  nextMeeting: { title: string; scheduledAt: Date } | null;
  taskCounts: { urgent: number; high: number; normal: number; low: number };
  totalOpen: number;
  overdue: number;
};

/**
 * Returns the minimal workspace snapshot used for the home page briefing card.
 * All queries run in parallel.
 */
export async function getBriefingSnapshot(
  userId: string,
): Promise<BriefingSnapshot> {
  const now = new Date();

  const [nextMeeting, openTasks] = await Promise.all([
    db.meeting.findFirst({
      where: { userId, status: "upcoming", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      select: { title: true, scheduledAt: true },
    }),
    db.task.findMany({
      where: { userId, status: { in: ["open", "in_progress"] } },
      select: { priority: true, dueDate: true },
    }),
  ]);

  const taskCounts = { urgent: 0, high: 0, normal: 0, low: 0 };
  let overdue = 0;

  for (const t of openTasks) {
    const p = t.priority as keyof typeof taskCounts;
    if (p in taskCounts) taskCounts[p]++;
    if (t.dueDate && t.dueDate < now) overdue++;
  }

  return {
    nextMeeting,
    taskCounts,
    totalOpen: openTasks.length,
    overdue,
  };
}
