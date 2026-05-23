/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";

import { db } from "@/lib/core/db";
import type { LogInteractionInput } from "./schemas";
import type { ContactNoteRecord } from "@/types/api";

export const CONTACT_NOTE_SELECT = {
  id: true,
  userId: true,
  contactId: true,
  type: true,
  note: true,
  date: true,
  createdAt: true,
} as const;

type ContactNoteRow = {
  id: string;
  userId: string;
  contactId: string;
  type: string;
  note: string;
  date: Date;
  createdAt: Date;
};

export function toContactNoteRecord(row: ContactNoteRow): ContactNoteRecord {
  return {
    id: row.id,
    userId: row.userId,
    contactId: row.contactId,
    type: row.type,
    note: row.note,
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export interface LogInteractionResult {
  ok: true;
  data: ContactNoteRecord;
}

export type LogInteractionFailure = { ok: false; error: string };

/**
 * Creates a ContactNote and updates Contact.lastContact to the interaction date.
 * Validates that the contact belongs to the user before writing.
 */
export async function logContactInteraction(
  userId: string,
  contactId: string,
  input: LogInteractionInput,
): Promise<LogInteractionResult | LogInteractionFailure> {
  // Ownership check
  const contact = await db.contact.findUnique({
    where: { id: contactId },
    select: { userId: true },
  });

  if (!contact) return { ok: false, error: "Contact not found." };
  if (contact.userId !== userId)
    return { ok: false, error: "Contact not found." };

  const interactionDate = input.date ?? new Date();

  const [row] = await db.$transaction([
    db.contactNote.create({
      data: {
        userId,
        contactId,
        type: input.type ?? "note",
        note: input.note,
        date: interactionDate,
      },
      select: CONTACT_NOTE_SELECT,
    }),
    db.contact.update({
      where: { id: contactId },
      data: { lastContact: interactionDate },
    }),
  ]);

  return { ok: true, data: toContactNoteRecord(row) };
}

/**
 * Returns all interaction notes for a contact, most recent first.
 */
export async function listContactInteractions(
  userId: string,
  contactId: string,
): Promise<ContactNoteRecord[]> {
  const rows = await db.contactNote.findMany({
    where: { userId, contactId },
    orderBy: { date: "desc" },
    select: CONTACT_NOTE_SELECT,
  });

  return rows.map(toContactNoteRecord);
}
