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
import type { UpdateSkillInput } from "./schemas";
import {
  getUnknownToolNames,
  normalizeAllowedTools,
  SKILL_SELECT,
  toSkillRecord,
} from "./shared.logic";

export type UpdateSkillResult =
  | { ok: true; skill: SkillRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; invalidTools: string[] };

export async function updateSkill(
  skillId: string,
  userId: string,
  input: UpdateSkillInput,
): Promise<UpdateSkillResult> {
  let allowedTools: string[] | undefined;

  if (input.allowedTools !== undefined) {
    allowedTools = normalizeAllowedTools(input.allowedTools);
    const invalidTools = getUnknownToolNames(allowedTools);

    if (invalidTools.length > 0) {
      return { ok: false, notFound: false, invalidTools };
    }
  }

  const row = await db.skill
    .update({
      where: { id: skillId, userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.instructionsMarkdown !== undefined && {
          instructionsMarkdown: input.instructionsMarkdown,
        }),
        ...(allowedTools !== undefined && { allowedTools }),
      },
      select: SKILL_SELECT,
    })
    .catch(() => null);

  if (!row) return { ok: false, notFound: true };

  return { ok: true, skill: toSkillRecord(row) };
}
