/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { CONTACT_SELECT, toContactRecord } from "./shared.logic";
import type { UpdateContactInput } from "./schemas";
import type { ContactRecord } from "@/types/api";

export type UpdateContactResult =
  | { ok: true; contact: ContactRecord }
  | { ok: false; notFound: true };

export async function updateContact(
  contactId: string,
  userId: string,
  input: UpdateContactInput,
): Promise<UpdateContactResult> {
  const row = await db.contact
    .update({
      where: { id: contactId, userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.company !== undefined && { company: input.company }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.lastContact !== undefined && {
          lastContact: input.lastContact,
        }),
        ...(input.labelIds !== undefined && {
          labelLinks: {
            deleteMany: {},
            create: input.labelIds.map((labelId) => ({ labelId })),
          },
        }),
      },
      select: CONTACT_SELECT,
    })
    .catch(() => null);

  if (!row) return { ok: false, notFound: true };
  return { ok: true, contact: toContactRecord(row) };
}
