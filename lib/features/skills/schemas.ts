/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import { z } from "zod";

export const SKILL_NAME_MAX = 15;
export const SKILL_DESCRIPTION_MAX = 100;
export const SKILL_INSTRUCTIONS_MAX = 500;
export const SKILL_ALLOWED_TOOLS_MAX = 10;

const allowedToolsSchema = z
  .array(z.string().min(1).max(100))
  .min(1)
  .max(SKILL_ALLOWED_TOOLS_MAX);

export const createSkillSchema = z.object({
  name: z.string().min(1).max(SKILL_NAME_MAX),
  description: z.string().min(1).max(SKILL_DESCRIPTION_MAX),
  instructionsMarkdown: z.string().min(1).max(SKILL_INSTRUCTIONS_MAX),
  allowedTools: allowedToolsSchema,
});

export const updateSkillSchema = z.object({
  name: z.string().min(1).max(SKILL_NAME_MAX).optional(),
  description: z.string().min(1).max(SKILL_DESCRIPTION_MAX).optional(),
  instructionsMarkdown: z
    .string()
    .min(1)
    .max(SKILL_INSTRUCTIONS_MAX)
    .optional(),
  allowedTools: allowedToolsSchema.optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
