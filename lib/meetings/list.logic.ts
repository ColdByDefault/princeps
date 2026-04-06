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

export async function listMeetings(
  userId: string,
  filter: ListMeetingsFilter = {},
): Promise<MeetingRecord[]> {
  const rows = await db.meeting.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: { scheduledAt: "asc" },
    select: MEETING_SELECT,
  });

  return rows.map(toMeetingRecord);
}
