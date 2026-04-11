/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
import type { MeetingRecord } from "@/types/api";

type ListMeetingsFilter = {
  status?: "upcoming" | "done" | "cancelled";
};

/**
 * Maximum rows returned for done/cancelled meetings.
 * Upcoming meetings are always returned in full (capped at 500).
 */
const DONE_LIMIT = 200;

/**
 * Auto-marks stale "upcoming" meetings as "done".
 * A meeting is stale when its end time (scheduledAt + durationMin) or
 * scheduledAt itself has passed. Runs as a side-effect before listing.
 */
async function autoExpireUpcoming(userId: string): Promise<void> {
  const now = new Date();

  // Pull only the fields needed to decide — no heavy select.
  const stale = await db.meeting.findMany({
    where: { userId, status: "upcoming" },
    select: { id: true, scheduledAt: true, durationMin: true },
  });

  const staleIds = stale
    .filter((m) => {
      const endTime = m.durationMin
        ? new Date(m.scheduledAt.getTime() + m.durationMin * 60_000)
        : m.scheduledAt;
      return endTime <= now;
    })
    .map((m) => m.id);

  if (staleIds.length === 0) return;

  await db.meeting.updateMany({
    where: { id: { in: staleIds } },
    data: { status: "done" },
  });
}

export async function listMeetings(
  userId: string,
  filter: ListMeetingsFilter = {},
): Promise<MeetingRecord[]> {
  // Expire any stale "upcoming" meetings before querying.
  await autoExpireUpcoming(userId);

  // Filtered view — simple take limit per status.
  if (filter.status) {
    const rows = await db.meeting.findMany({
      where: { userId, status: filter.status },
      orderBy: { scheduledAt: filter.status === "upcoming" ? "asc" : "desc" },
      take: filter.status === "upcoming" ? 500 : DONE_LIMIT,
      select: MEETING_SELECT,
    });
    return rows.map(toMeetingRecord);
  }

  // "All" view: upcoming first (capped at 500) + recent past (capped at DONE_LIMIT).
  const [upcoming, past] = await Promise.all([
    db.meeting.findMany({
      where: { userId, status: "upcoming" },
      orderBy: { scheduledAt: "asc" },
      take: 500,
      select: MEETING_SELECT,
    }),
    db.meeting.findMany({
      where: { userId, status: { in: ["done", "cancelled"] } },
      orderBy: { scheduledAt: "desc" },
      take: DONE_LIMIT,
      select: MEETING_SELECT,
    }),
  ]);

  return [...upcoming, ...past].map(toMeetingRecord);
}
