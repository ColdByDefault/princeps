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
  const existing = await db.task.findFirst({ where: { id: taskId, userId } });

  if (!existing) {
    return { ok: false };
  }

  await db.task.delete({ where: { id: taskId } });
  return { ok: true };
}
