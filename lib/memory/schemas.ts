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

export const createMemoryEntrySchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(2000),
});

export const updateMemoryEntrySchema = z.object({
  key: z.string().min(1).max(100).optional(),
  value: z.string().min(1).max(2000).optional(),
});

export type CreateMemoryEntryInput = z.infer<typeof createMemoryEntrySchema>;
export type UpdateMemoryEntryInput = z.infer<typeof updateMemoryEntrySchema>;
