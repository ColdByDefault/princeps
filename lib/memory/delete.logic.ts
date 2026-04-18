/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
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
