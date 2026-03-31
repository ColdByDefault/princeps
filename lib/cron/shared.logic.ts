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

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Returns the numeric day-of-week (0=Sun … 6=Sat) for `now` in the given
 * timezone. Falls back to UTC on invalid or missing timezone.
 */
export function localDayOfWeek(now: Date, timezone: string | null): number {
  if (!timezone) return now.getUTCDay();
  try {
    const name = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
    }).format(now);
    const idx = WEEKDAYS.indexOf(name as (typeof WEEKDAYS)[number]);
    return idx === -1 ? now.getUTCDay() : idx;
  } catch {
    return now.getUTCDay();
  }
}

/**
 * Returns the UTC timestamp for Monday 00:00:00 of the current ISO week as
 * seen in the user's timezone. Falls back to UTC Monday on invalid timezone.
 *
 * Uses noon-UTC as a stable reference so that DST transitions around midnight
 * do not shift the result to the wrong calendar date.
 */
export function localWeekStart(now: Date, timezone: string | null): Date {
  if (!timezone) return utcWeekStart(now);
  try {
    const dayNum = localDayOfWeek(now, timezone);
    const diffToMonday = dayNum === 0 ? -6 : 1 - dayNum;

    // Approximate Monday's date by shifting `now` by the diff
    const mondayApprox = new Date(now.getTime() + diffToMonday * 86400000);

    // Get the YYYY-MM-DD of that Monday in the user's timezone (en-CA = ISO order)
    const mondayDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(mondayApprox);

    // Anchor at noon UTC on that date — safely within the same calendar day in
    // any timezone (avoids DST-midnight ambiguity)
    const noonUtc = new Date(`${mondayDateStr}T12:00:00Z`);

    // Determine UTC offset at that point: local hour at noon UTC tells us the offset
    const localHourAtNoon = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false,
      }).format(noonUtc),
      10,
    );
    // offsetHours > 0 → ahead of UTC (e.g. UTC+9 → 21:00 local at UTC noon)
    const offsetMs = (localHourAtNoon - 12) * 3600000;

    // UTC midnight for that date, then subtract the UTC offset to get local midnight
    const utcMidnight = new Date(`${mondayDateStr}T00:00:00Z`);
    return new Date(utcMidnight.getTime() - offsetMs);
  } catch {
    return utcWeekStart(now);
  }
}

function utcWeekStart(now: Date): Date {
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
