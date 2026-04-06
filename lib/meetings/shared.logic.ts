/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { MeetingRecord } from "@/types/api";

export const MEETING_SELECT = {
  id: true,
  title: true,
  scheduledAt: true,
  durationMin: true,
  location: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true } },
    },
  },
} as const;

type MeetingRow = {
  id: string;
  title: string;
  scheduledAt: Date;
  durationMin: number | null;
  location: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: { label: { id: string; name: string; color: string } }[];
};

export function toMeetingRecord(row: MeetingRow): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMin: row.durationMin,
    location: row.location,
    agenda: null,
    summary: null,
    prepPack: null,
    status: row.status,
    googleEventId: null,
    labels: row.labelLinks.map((l) => l.label),
    participants: [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
