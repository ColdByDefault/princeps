/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().max(4000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  notes: z.string().max(4000).optional().nullable(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
