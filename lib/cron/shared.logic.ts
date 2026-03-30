/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import {
  type ScheduledNotifPrefs,
  type ScheduledCadence,
  DEFAULT_SCHEDULED_NOTIF_PREFS,
} from "@/types/settings";

export type { ScheduledNotifPrefs, ScheduledCadence };
export { DEFAULT_SCHEDULED_NOTIF_PREFS as SCHEDULED_NOTIF_DEFAULTS };

function parseCadence(v: unknown, allowed: string[]): string {
  return typeof v === "string" && allowed.includes(v) ? v : allowed[0];
}

export async function getScheduledNotifPrefs(
  userId: string,
): Promise<ScheduledNotifPrefs> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const raw =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  const sn =
    raw["scheduledNotifications"] &&
    typeof raw["scheduledNotifications"] === "object"
      ? (raw["scheduledNotifications"] as Record<string, unknown>)
      : {};

  return {
    briefing: parseCadence(sn["briefing"], [
      "off",
      "daily",
      "weekly",
    ]) as ScheduledNotifPrefs["briefing"],
    tasksOverdue: parseCadence(sn["tasksOverdue"], [
      "off",
      "daily",
    ]) as ScheduledNotifPrefs["tasksOverdue"],
    meetingFollowup: parseCadence(sn["meetingFollowup"], [
      "off",
      "on",
    ]) as ScheduledNotifPrefs["meetingFollowup"],
    weeklyDigest: parseCadence(sn["weeklyDigest"], [
      "off",
      "on",
    ]) as ScheduledNotifPrefs["weeklyDigest"],
  };
}

export function getScheduledNotifPrefsFromRaw(
  preferences: Record<string, unknown>,
): ScheduledNotifPrefs {
  const sn =
    preferences["scheduledNotifications"] &&
    typeof preferences["scheduledNotifications"] === "object"
      ? (preferences["scheduledNotifications"] as Record<string, unknown>)
      : {};

  return {
    briefing: parseCadence(sn["briefing"], [
      "off",
      "daily",
      "weekly",
    ]) as ScheduledNotifPrefs["briefing"],
    tasksOverdue: parseCadence(sn["tasksOverdue"], [
      "off",
      "daily",
    ]) as ScheduledNotifPrefs["tasksOverdue"],
    meetingFollowup: parseCadence(sn["meetingFollowup"], [
      "off",
      "on",
    ]) as ScheduledNotifPrefs["meetingFollowup"],
    weeklyDigest: parseCadence(sn["weeklyDigest"], [
      "off",
      "on",
    ]) as ScheduledNotifPrefs["weeklyDigest"],
  };
}

/**
 * Returns true if a notification with the given category was already created
 * for this user in the current UTC day.
 */
export async function alreadyFiredToday(
  userId: string,
  category: string,
): Promise<boolean> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const existing = await db.notification.findFirst({
    where: { userId, category, createdAt: { gte: startOfToday } },
    select: { id: true },
  });

  return !!existing;
}

/**
 * Returns true if a notification with the given category was already created
 * for this user in the current ISO week (Mon–Sun UTC).
 */
export async function alreadyFiredThisWeek(
  userId: string,
  category: string,
): Promise<boolean> {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const existing = await db.notification.findFirst({
    where: { userId, category, createdAt: { gte: monday } },
    select: { id: true },
  });

  return !!existing;
}
