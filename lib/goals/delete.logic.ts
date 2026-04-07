/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";
import { db } from "@/lib/db";

export async function deleteGoal(
  goalId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.goal.deleteMany({
    where: { id: goalId, userId },
  });
  return { ok: count > 0 };
}
