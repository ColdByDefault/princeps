/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default("#6366f1"),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
