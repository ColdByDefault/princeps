/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import "server-only";

import { db } from "@/lib/core/db";

export async function deleteReadingItem(
  userId: string,
  id: string,
): Promise<{ deleted: boolean }> {
  const result = await db.readingItem.deleteMany({
    where: { id, userId },
  });

  return { deleted: result.count > 0 };
}
