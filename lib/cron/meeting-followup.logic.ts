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

const COOLDOWN_HOURS = 23;

/**
 * For each opted-in user, finds meetings that ended more than 2 hours ago
 * with no summary/capture recorded, and nudges the user to capture notes.
 */
export async function runMeetingFollowupJob(): Promise<{
  processed: number;
  skipped: number;
}> {
  const users = await db.user.findMany({
    select: { id: true, preferences: true },
  });

  let processed = 0;
  let skipped = 0;

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);

  for (const user of users) {
    try {
      const raw =
        user.preferences && typeof user.preferences === "object"
          ? (user.preferences as Record<string, unknown>)
          : {};
      const prefs = getScheduledNotifPrefsFromRaw(raw);

      if (prefs.meetingFollowup === "off") {
        skipped++;
        continue;
      }
      if (await alreadyFiredToday(user.id, "scheduled_meeting_followup")) {
        skipped++;
        continue;
      }

      // Meetings that ended >2h ago without a summary, within the last 24h
      const meetings = await db.meeting.findMany({
        where: {
          userId: user.id,
          status: { not: "cancelled" },
          summary: null,
          scheduledAt: { gte: oneDayAgo, lt: twoHoursAgo },
        },
        select: { title: true },
        take: 5,
      });

      if (meetings.length === 0) {
        skipped++;
        continue;
      }

      const lang = typeof raw["language"] === "string" ? raw["language"] : "en";
      const meetingList = meetings.map((m) => `• ${m.title}`).join("\n");

      const notification = await createNotification({
        userId: user.id,
        category: "scheduled_meeting_followup",
        source: "system",
        title:
          lang === "de"
            ? "Besprechungsnotizen ausstehend"
            : "Meeting notes pending",
        body:
          lang === "de"
            ? `Diese Besprechungen haben noch keine Notizen:\n${meetingList}`
            : `These meetings have no notes captured yet:\n${meetingList}`,
      });

      emitNotification(user.id, notification);
      processed++;
    } catch (err) {
      console.error(`[cron:meeting-followup] User ${user.id} failed:`, err);
      skipped++;
    }
  }

  return { processed, skipped };
}
