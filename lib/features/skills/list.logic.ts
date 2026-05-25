/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import "server-only";

import { db } from "@/lib/core/db";
import type { SkillRecord } from "@/types/api";
import { SKILL_SELECT, toSkillRecord } from "./shared.logic";

export async function listSkills(userId: string): Promise<SkillRecord[]> {
  const rows = await db.skill.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: SKILL_SELECT,
  });

  return rows.map(toSkillRecord);
}

export async function getSkillById(
  userId: string,
  skillId: string,
): Promise<SkillRecord | null> {
  const row = await db.skill.findFirst({
    where: { id: skillId, userId },
    select: SKILL_SELECT,
  });

  return row ? toSkillRecord(row) : null;
}
