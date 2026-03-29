/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const existing = await db.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) return false;
  await db.task.delete({ where: { id: taskId } });
  return true;
}
