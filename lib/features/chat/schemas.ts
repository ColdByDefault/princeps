/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import { z } from "zod";

export const patchChatSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    activeSkillId: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (value) => value.title !== undefined || value.activeSkillId !== undefined,
    {
      message: "At least one field is required",
    },
  );

export type PatchChatInput = z.infer<typeof patchChatSchema>;
