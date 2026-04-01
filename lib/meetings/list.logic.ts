/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelOptionRecord } from "@/types/api";
import { meetingInclude, toMeetingRecord } from "./shared.logic";

export interface MeetingParticipantRecord {
  id: string;
  contactId: string;
  contactName: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  scheduledAt: Date;
  durationMin: number | null;
  location: string | null;
  agenda: string | null;
  summary: string | null;
  prepPack: string | null;
  status: string;
  googleEventId: string | null;
  labels: LabelOptionRecord[];
  createdAt: Date;
  updatedAt: Date;
  participants: MeetingParticipantRecord[];
}

/**
 * Returns all meetings for the given user, ordered by scheduledAt descending.
 */
export async function listMeetings(userId: string): Promise<MeetingRecord[]> {
  const rows = await db.meeting.findMany({
    where: { userId },
    orderBy: { scheduledAt: "desc" },
    include: meetingInclude,
  });

  return rows.map(toMeetingRecord);
}
