/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { generateBriefing } from "@/lib/briefing/generate.logic";
import { createNotification } from "@/lib/notifications/create.logic";
import { emitNotification } from "@/lib/notifications/emitter";
import {
  getScheduledNotifPrefsFromRaw,
  alreadyFiredToday,
  alreadyFiredThisWeek,
} from "./shared.logic";

/**
 * Runs the daily briefing job for all opted-in users.
 * Each eligible user gets a "scheduled_briefing" notification with the
 * briefing content as the body.
 */
export async function runBriefingJob(): Promise<{
  processed: number;
  skipped: number;
}> {
  const users = await db.user.findMany({
    select: { id: true, name: true, timezone: true, preferences: true },
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

      if (prefs.briefing === "off") {
        skipped++;
        continue;
      }

      const isWeeklyAndNotFriday =
        prefs.briefing === "weekly" && new Date().getUTCDay() !== 5;
      if (isWeeklyAndNotFriday) {
        skipped++;
        continue;
      }

      const dedupCheck =
        prefs.briefing === "weekly"
          ? await alreadyFiredThisWeek(user.id, "scheduled_briefing")
          : await alreadyFiredToday(user.id, "scheduled_briefing");
      if (dedupCheck) {
        skipped++;
        continue;
      }

      const lang = typeof raw["language"] === "string" ? raw["language"] : "en";
      const { content } = await generateBriefing(
        user.id,
        user.name ?? null,
        user.timezone ?? "UTC",
        lang,
      );

      const notification = await createNotification({
        userId: user.id,
        category: "scheduled_briefing",
        source: "system",
        title: lang === "de" ? "Ihr tägliches Briefing" : "Your daily briefing",
        body: content,
      });

      emitNotification(user.id, notification);
      processed++;
    } catch (err) {
      console.error(`[cron:briefing] User ${user.id} failed:`, err);
      skipped++;
    }
  }

  return { processed, skipped };
}
