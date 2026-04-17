/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { CONTACT_SELECT, toContactRecord } from "./shared.logic";
import type { ContactRecord } from "@/types/api";

export async function listContacts(userId: string): Promise<ContactRecord[]> {
  const rows = await db.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: CONTACT_SELECT,
  });

  return rows.map(toContactRecord);
}

export async function getContactById(
  userId: string,
  contactId: string,
): Promise<ContactRecord | null> {
  const row = await db.contact.findFirst({
    where: { id: contactId, userId },
    select: CONTACT_SELECT,
  });

  return row ? toContactRecord(row) : null;
}
