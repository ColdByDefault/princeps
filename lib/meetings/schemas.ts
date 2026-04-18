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

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  scheduledAt: isoDatetimeField,
  durationMin: z.number().int().min(1).max(1440).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  agenda: z.string().max(300).optional().nullable(),
  summary: z.string().max(500).optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  participantContactIds: z.array(z.string()).optional(),
  source: z.string().optional(),
  /** When true, creates a corresponding event on the user's Google Calendar. */
  pushToGoogle: z.boolean().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  scheduledAt: isoDatetimeField.optional(),
  durationMin: z.number().int().min(1).max(1440).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  status: z.enum(["upcoming", "done", "cancelled"]).optional(),
  kind: z.enum(["meeting", "appointment"]).optional(),
  agenda: z.string().max(300).optional().nullable(),
  summary: z.string().max(500).optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  participantContactIds: z.array(z.string()).optional(),
  linkedTaskIds: z.array(z.string()).optional(),
  /** When true and the meeting has no googleEventId, creates a new Google Calendar event. */
  pushToGoogle: z.boolean().optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
