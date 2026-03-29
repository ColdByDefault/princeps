/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export interface ContactRecord {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  lastContact: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns all contacts for the given user, ordered by name ascending.
 */
export async function listContacts(userId: string): Promise<ContactRecord[]> {
  const rows = await db.contact.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    ...r,
    tags: (r.tags as string[]) ?? [],
  }));
}
