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
  alreadyFiredToday,
} from "./shared.logic";

/**
 * Runs the overdue task alert for all opted-in users.
 * Fires a single notification listing overdue task titles grouped by priority.
 */
export async function runTasksOverdueJob(): Promise<{
  processed: number;
  skipped: number;
}> {
  const users = await db.user.findMany({
    select: { id: true, preferences: true },
  });

  let processed = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const raw =
        user.preferences && typeof user.preferences === "object"
          ? (user.preferences as Record<string, unknown>)
          : {};
      const prefs = getScheduledNotifPrefsFromRaw(raw);

      if (prefs.tasksOverdue === "off") {
        skipped++;
        continue;
      }
      if (await alreadyFiredToday(user.id, "scheduled_tasks_overdue")) {
        skipped++;
        continue;
      }

      const overdue = await db.task.findMany({
        where: {
          userId: user.id,
          status: { in: ["open", "in_progress"] },
          dueDate: { lt: new Date() },
        },
        select: { title: true, priority: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      });

      if (overdue.length === 0) {
        skipped++;
        continue;
      }

      const lang = typeof raw["language"] === "string" ? raw["language"] : "en";
      const lines = overdue
        .map((t) => `• ${t.title} [${t.priority}]`)
        .join("\n");

      const notification = await createNotification({
        userId: user.id,
        category: "scheduled_tasks_overdue",
        source: "system",
        title:
          lang === "de"
            ? `${overdue.length} überfällige Aufgabe${overdue.length > 1 ? "n" : ""}`
            : `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
        body: lines,
      });

      emitNotification(user.id, notification);
      processed++;
    } catch (err) {
      console.error(`[cron:tasks-overdue] User ${user.id} failed:`, err);
      skipped++;
    }
  }

  return { processed, skipped };
}
