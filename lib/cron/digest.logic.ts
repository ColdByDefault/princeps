/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create.logic";
import { emitNotification } from "@/lib/notifications/emitter";
import {
  getScheduledNotifPrefsFromRaw,
  alreadyFiredThisWeek,
} from "./shared.logic";

/**
 * Runs the weekly digest for all opted-in users (intended to run on Fridays).
 * Summarizes decisions made, tasks closed, and meetings held during the week.
 */
export async function runWeeklyDigestJob(): Promise<{
  processed: number;
  skipped: number;
}> {
  const users = await db.user.findMany({
    select: { id: true, preferences: true },
  });

  let processed = 0;
  let skipped = 0;

  // Start of current ISO week (Monday UTC)
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  for (const user of users) {
    try {
      const raw =
        user.preferences && typeof user.preferences === "object"
          ? (user.preferences as Record<string, unknown>)
          : {};
      const prefs = getScheduledNotifPrefsFromRaw(raw);

      if (prefs.weeklyDigest === "off") {
        skipped++;
        continue;
      }
      if (await alreadyFiredThisWeek(user.id, "scheduled_weekly_digest")) {
        skipped++;
        continue;
      }

      const [decisionsCount, tasksClosedCount, meetingsCount] =
        await Promise.all([
          db.decision.count({
            where: {
              userId: user.id,
              status: "decided",
              updatedAt: { gte: weekStart },
            },
          }),
          db.task.count({
            where: {
              userId: user.id,
              status: { in: ["done", "cancelled"] },
              updatedAt: { gte: weekStart },
            },
          }),
          db.meeting.count({
            where: {
              userId: user.id,
              status: "done",
              scheduledAt: { gte: weekStart },
            },
          }),
        ]);

      if (
        decisionsCount === 0 &&
        tasksClosedCount === 0 &&
        meetingsCount === 0
      ) {
        skipped++;
        continue;
      }

      const lang = typeof raw["language"] === "string" ? raw["language"] : "en";

      const body =
        lang === "de"
          ? `Diese Woche: ${meetingsCount} Besprechung${meetingsCount !== 1 ? "en" : ""} abgeschlossen, ${tasksClosedCount} Aufgabe${tasksClosedCount !== 1 ? "n" : ""} erledigt, ${decisionsCount} Entscheidung${decisionsCount !== 1 ? "en" : ""} getroffen.`
          : `This week: ${meetingsCount} meeting${meetingsCount !== 1 ? "s" : ""} held, ${tasksClosedCount} task${tasksClosedCount !== 1 ? "s" : ""} closed, ${decisionsCount} decision${decisionsCount !== 1 ? "s" : ""} made.`;

      const notification = await createNotification({
        userId: user.id,
        category: "scheduled_weekly_digest",
        source: "system",
        title:
          lang === "de" ? "Ihre Wochenzusammenfassung" : "Your weekly digest",
        body,
      });

      emitNotification(user.id, notification);
      processed++;
    } catch (err) {
      console.error(`[cron:digest] User ${user.id} failed:`, err);
      skipped++;
    }
  }

  return { processed, skipped };
}
