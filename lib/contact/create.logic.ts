/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { CONTACT_SELECT, toContactRecord } from "./shared.logic";
import type { CreateContactInput } from "./schemas";
import type { ContactRecord } from "@/types/api";

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
      email: input.email || null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      lastContact: input.lastContact ?? null,
      ...(input.labelIds?.length
        ? {
            labelLinks: {
              create: input.labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    select: CONTACT_SELECT,
  });

  return toContactRecord(row);
}
