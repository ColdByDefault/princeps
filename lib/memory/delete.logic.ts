/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteMemoryEntry(
  userId: string,
  id: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.memoryEntry.deleteMany({
    where: { id, userId },
  });
  return { ok: count > 0 };
}
