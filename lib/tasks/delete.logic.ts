/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteTask(
  taskId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  // Single round-trip: delete only if the row belongs to this user.
  const { count } = await db.task.deleteMany({
    where: { id: taskId, userId },
  });
  return { ok: count > 0 };
}
