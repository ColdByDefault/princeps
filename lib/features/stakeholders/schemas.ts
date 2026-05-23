/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import { z } from "zod";

export const VALID_HEALTH = ["warm", "neutral", "cold"] as const;
export type StakeholderHealth = (typeof VALID_HEALTH)[number];

export const createStakeholderSchema = z.object({
  contactId: z.string().min(1),
  goalId: z.string().optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  health: z.enum(VALID_HEALTH).default("neutral"),
  notes: z.string().max(500).optional().nullable(),
});

export const updateStakeholderSchema = z.object({
  role: z.string().max(100).optional().nullable(),
  health: z.enum(VALID_HEALTH).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>;
export type UpdateStakeholderInput = z.infer<typeof updateStakeholderSchema>;
