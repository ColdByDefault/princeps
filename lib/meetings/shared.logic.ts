/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import {
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";
import type { MeetingParticipantRecord, MeetingRecord } from "./list.logic";

export const meetingInclude = {
  participants: {
    include: { contact: { select: { id: true, name: true } } },
  },
  labelLinks: {
    include: { label: { select: labelOptionSelect } },
  },
} satisfies Prisma.MeetingInclude;

export type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: typeof meetingInclude;
}>;

export function toMeetingRecord(row: MeetingWithRelations): MeetingRecord {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt,
    durationMin: row.durationMin,
    location: row.location,
    agenda: row.agenda,
    summary: row.summary,
    prepPack: row.prepPack,
    status: row.status,
    googleEventId: row.googleEventId ?? null,
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    participants: row.participants.map(
      (p): MeetingParticipantRecord => ({
        id: p.id,
        contactId: p.contactId,
        contactName: p.contact.name,
      }),
    ),
  };
}
