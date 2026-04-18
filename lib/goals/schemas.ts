/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { z } from "zod";

/** Accepts full ISO 8601 datetimes and normalises bare YYYY-MM-DD date strings
 *  to YYYY-MM-DDT00:00:00Z so the LLM never hits a validation error for
 *  omitting the time component. */
const isoDatetimeField = z.preprocess(
  (v) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? `${v}T00:00:00Z`
      : v,
  z.string().datetime({ offset: true }),
);

const milestoneInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(255),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const createGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  targetDate: isoDatetimeField.optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  taskIds: z.array(z.string()).optional(),
  milestones: z.array(milestoneInputSchema).optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  targetDate: isoDatetimeField.optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  taskIds: z.array(z.string()).optional(),
  milestones: z.array(milestoneInputSchema).optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1).max(255),
  position: z.number().int().min(0).optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
