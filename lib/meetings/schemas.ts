/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMin: z.number().int().min(1).max(1440).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  agenda: z.string().max(10000).optional().nullable(),
  summary: z.string().max(10000).optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  participantContactIds: z.array(z.string()).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  durationMin: z.number().int().min(1).max(1440).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  status: z.enum(["upcoming", "done", "cancelled"]).optional(),
  agenda: z.string().max(10000).optional().nullable(),
  summary: z.string().max(10000).optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  participantContactIds: z.array(z.string()).optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
