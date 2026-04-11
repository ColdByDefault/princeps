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

export async function listMeetings(
  userId: string,
  filter: ListMeetingsFilter = {},
): Promise<MeetingRecord[]> {
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
