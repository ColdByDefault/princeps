/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

/**
 * Deletes a contact belonging to the given user.
 * Returns false if the contact does not exist or belongs to a different user.
 */
export async function deleteContact(
  userId: string,
  contactId: string,
): Promise<boolean> {
  const existing = await db.contact.findUnique({
    where: { id: contactId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) return false;

  await db.contact.delete({ where: { id: contactId } });
  return true;
}
