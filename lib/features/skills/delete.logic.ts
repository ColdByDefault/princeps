/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import "server-only";

import { db } from "@/lib/core/db";

export async function deleteSkill(
  skillId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.skill.deleteMany({
    where: { id: skillId, userId },
  });

  return { ok: count > 0 };
}
