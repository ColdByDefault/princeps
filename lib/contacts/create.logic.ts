/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { ContactRecord } from "./list.logic";

export interface CreateContactInput {
  name: string;
  role?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  tags?: string[];
  lastContact?: Date | null;
}

/**
 * Creates a new contact for the given user and returns the created record.
 */
export async function createContact(
  userId: string,
  input: CreateContactInput,
): Promise<ContactRecord> {
  const row = await db.contact.create({
    data: {
      userId,
      name: input.name,
      role: input.role ?? null,
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
      lastContact: input.lastContact ?? null,
    },
  });

  return { ...row, tags: (row.tags as string[]) ?? [] };
}
