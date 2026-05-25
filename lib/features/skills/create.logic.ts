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
import type { CreateSkillInput } from "./schemas";
import {
  getUnknownToolNames,
  normalizeAllowedTools,
  SKILL_SELECT,
  toSkillRecord,
} from "./shared.logic";

export type CreateSkillResult =
  | { ok: true; skill: SkillRecord }
  | { ok: false; invalidTools: string[] };

export async function createSkill(
  userId: string,
  input: CreateSkillInput,
): Promise<CreateSkillResult> {
  const allowedTools = normalizeAllowedTools(input.allowedTools);
  const invalidTools = getUnknownToolNames(allowedTools);

  if (invalidTools.length > 0) {
    return { ok: false, invalidTools };
  }

  const row = await db.skill.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      instructionsMarkdown: input.instructionsMarkdown,
      allowedTools,
    },
    select: SKILL_SELECT,
  });

  return { ok: true, skill: toSkillRecord(row) };
}
