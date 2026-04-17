/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
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

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().max(250).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueDate: isoDatetimeField.optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  goalIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  notes: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueDate: isoDatetimeField.optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  goalIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
