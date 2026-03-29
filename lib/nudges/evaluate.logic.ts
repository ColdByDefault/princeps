/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create.logic";
import { emitNotification } from "@/lib/notifications/emitter";

/** Keys stored in User.preferences under "nudgeLastFired" */
type NudgeState = Record<string, number>; // key → epoch ms

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours per item

function isCooledDown(state: NudgeState, key: string): boolean {
  const last = state[key];
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

async function markFired(userId: string, key: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  const prefs =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};
  const state = (
    prefs["nudgeLastFired"] && typeof prefs["nudgeLastFired"] === "object"
      ? prefs["nudgeLastFired"]
      : {}
  ) as NudgeState;

  state[key] = Date.now();
  await db.user.update({
    where: { id: userId },
    data: { preferences: { ...prefs, nudgeLastFired: state } },
  });
}

async function fireNudge(
  userId: string,
  category: string,
  title: string,
  body: string,
): Promise<void> {
  const n = await createNotification({
    userId,
    category,
    source: "system",
    title,
    body,
  });
  emitNotification(userId, n);
}

/**
 * Evaluate all nudge triggers for a user and fire notifications for any
 * that are newly applicable (respecting the 24-hour per-item cooldown).
 */
export async function evaluateNudges(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const prefs =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};
  const state = (
    prefs["nudgeLastFired"] && typeof prefs["nudgeLastFired"] === "object"
      ? prefs["nudgeLastFired"]
      : {}
  ) as NudgeState;

  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [upcomingMeetings, overdueTasks, staleDecisions] = await Promise.all([
    // Meetings starting within the next 2 hours with no prep pack
    db.meeting.findMany({
      where: {
        userId,
        status: "upcoming",
        prepPack: null,
        scheduledAt: { gte: now, lte: twoHoursLater },
      },
      select: { id: true, title: true },
    }),
    // Tasks overdue by more than 1 day
    db.task.findMany({
      where: {
        userId,
        status: { in: ["open", "in_progress"] },
        dueDate: { lt: oneDayAgo },
      },
      select: { id: true, title: true },
    }),
    // Decisions open for more than 14 days
    db.decision.findMany({
      where: {
        userId,
        status: "open",
        createdAt: { lt: fourteenDaysAgo },
      },
      select: { id: true, title: true },
    }),
  ]);

  const updates: Promise<void>[] = [];

  for (const meeting of upcomingMeetings) {
    const key = `meeting_prep_${meeting.id}`;
    if (isCooledDown(state, key)) continue;
    updates.push(
      fireNudge(
        userId,
        "nudge_meeting_prep",
        meeting.title,
        "Meeting starting soon — no prep pack generated yet.",
      ).then(() => markFired(userId, key)),
    );
  }

  for (const task of overdueTasks) {
    const key = `task_overdue_${task.id}`;
    if (isCooledDown(state, key)) continue;
    updates.push(
      fireNudge(
        userId,
        "nudge_task_overdue",
        task.title,
        "This task is overdue.",
      ).then(() => markFired(userId, key)),
    );
  }

  for (const decision of staleDecisions) {
    const key = `decision_stale_${decision.id}`;
    if (isCooledDown(state, key)) continue;
    updates.push(
      fireNudge(
        userId,
        "nudge_decision_stale",
        decision.title,
        "This decision has been open for over 14 days.",
      ).then(() => markFired(userId, key)),
    );
  }

  await Promise.all(updates);
}
