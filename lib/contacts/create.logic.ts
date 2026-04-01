/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import {
  labelOptionSelect,
  toLabelOptionRecord,
  assertOwnedLabelIds,
} from "@/lib/labels/shared.logic";
import type { ContactRecord } from "./list.logic";

export interface CreateContactInput {
  name: string;
  role?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  labelIds?: string[];
  lastContact?: Date | null;
}

/**
 * Creates a new contact for the given user and returns the created record.
 */
export async function createContact(
  userId: string,
  input: CreateContactInput,
): Promise<ContactRecord> {
  const labelIds = await assertOwnedLabelIds(userId, input.labelIds);

  const row = await db.contact.create({
    data: {
      userId,
      name: input.name,
      role: input.role ?? null,
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      lastContact: input.lastContact ?? null,
      ...(labelIds.length > 0
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    include: {
      labelLinks: {
        include: { label: { select: labelOptionSelect } },
      },
    },
  });

  return {
    ...row,
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
  };
}
