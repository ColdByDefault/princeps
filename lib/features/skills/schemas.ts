/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import { z } from "zod";

const allowedToolsSchema = z.array(z.string().min(1).max(100)).min(1).max(128);

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  instructionsMarkdown: z.string().min(1).max(20_000),
  allowedTools: allowedToolsSchema,
});

export const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  instructionsMarkdown: z.string().min(1).max(20_000).optional(),
  allowedTools: allowedToolsSchema.optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
