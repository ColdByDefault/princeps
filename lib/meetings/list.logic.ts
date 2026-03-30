/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

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
    include: {
      participants: {
        include: { contact: { select: { id: true, name: true } } },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    scheduledAt: r.scheduledAt,
    durationMin: r.durationMin,
    location: r.location,
    agenda: r.agenda,
    summary: r.summary,
    prepPack: r.prepPack,
    status: r.status,
    googleEventId: r.googleEventId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    participants: r.participants.map((p) => ({
      id: p.id,
      contactId: p.contactId,
      contactName: p.contact.name,
    })),
  }));
}
