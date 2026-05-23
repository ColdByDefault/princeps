/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import { z } from "zod";

export const createReadingItemSchema = z.object({
  url: z.string().url("Invalid URL.").max(2000),
  title: z.string().min(1).max(255).optional(),
});

export const updateReadingItemSchema = z.object({
  status: z.enum(["unread", "read", "archived"]).optional(),
  title: z.string().min(1).max(255).optional().nullable(),
});

export type CreateReadingItemInput = z.infer<typeof createReadingItemSchema>;
export type UpdateReadingItemInput = z.infer<typeof updateReadingItemSchema>;
