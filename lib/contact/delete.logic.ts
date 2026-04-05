/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteContact(
  contactId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  // Single round-trip: deleteMany with userId in where acts as ownership check.
  const { count } = await db.contact.deleteMany({
    where: { id: contactId, userId },
  });

  return { ok: count > 0 };
}
