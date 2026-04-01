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

export interface UpdateContactInput {
  name?: string;
  role?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  tags?: string[];
  labelIds?: string[];
  lastContact?: Date | null;
}

/**
 * Updates an existing contact.
 * Returns the updated record, or null if the contact does not exist or
 * belongs to a different user.
 */
export async function updateContact(
  userId: string,
  contactId: string,
  input: UpdateContactInput,
): Promise<ContactRecord | null> {
  const existing = await db.contact.findUnique({
    where: { id: contactId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) return null;

  const labelIds =
    input.labelIds !== undefined
      ? await assertOwnedLabelIds(userId, input.labelIds)
      : undefined;

  const { labelIds: _labelIds, ...fields } = input;

  const row = await db.contact.update({
    where: { id: contactId },
    data: {
      ...fields,
      ...(labelIds !== undefined && {
        labelLinks: {
          deleteMany: {},
          create: labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
    include: {
      labelLinks: {
        include: { label: { select: labelOptionSelect } },
      },
    },
  });

  return {
    ...row,
    tags: (row.tags as string[]) ?? [],
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
  };
}
