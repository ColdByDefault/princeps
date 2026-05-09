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

export const createDecisionSchema = z.object({
  title: z.string().min(1).max(255),
  rationale: z.string().max(250).optional().nullable(),
  outcome: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "decided", "reversed"]).optional(),
  decidedAt: isoDatetimeField.optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export const updateDecisionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  rationale: z.string().max(250).optional().nullable(),
  outcome: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "decided", "reversed"]).optional(),
  decidedAt: isoDatetimeField.optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;
