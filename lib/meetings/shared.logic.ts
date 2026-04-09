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
  agenda: true,
  summary: true,
  prepPack: true,
  createdAt: true,
  updatedAt: true,
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true, icon: true } },
    },
  },
  participants: {
    select: {
      id: true,
      contactId: true,
      contact: { select: { name: true } },
    },
  },
  tasks: {
    select: {
      id: true,
      title: true,
      status: true,
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
  agenda: string | null;
  summary: string | null;
  prepPack: string | null;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: { label: { id: string; name: string; color: string } }[];
  participants: { id: string; contactId: string; contact: { name: string } }[];
  tasks: { id: string; title: string; status: string }[];
};

export function toMeetingRecord(row: MeetingRow): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMin: row.durationMin,
    location: row.location,
    agenda: row.agenda,
    summary: row.summary,
    prepPack: row.prepPack,
    status: row.status,
    googleEventId: null,
    labels: row.labelLinks.map((l) => l.label),
    participants: row.participants.map((p) => ({
      id: p.id,
      contactId: p.contactId,
      contactName: p.contact.name,
    })),
    tasks: row.tasks,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
