import { z } from "zod";

export const createDecisionSchema = z.object({
  title: z.string().min(1).max(255),
  rationale: z.string().max(250).optional().nullable(),
  outcome: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "decided", "reversed"]).optional(),
  decidedAt: z.string().datetime({ offset: true }).optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export const updateDecisionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  rationale: z.string().max(250).optional().nullable(),
  outcome: z.string().max(250).optional().nullable(),
  status: z.enum(["open", "decided", "reversed"]).optional(),
  decidedAt: z.string().datetime({ offset: true }).optional().nullable(),
  meetingId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;
