import { z } from "zod";

const DECISION_STATUS = ["open", "decided", "reversed"] as const;

const dateString = z.string().refine((s) => !isNaN(Date.parse(s)), {
  message: "Must be a valid date string.",
});

export const DecisionCreateSchema = z.object({
  title: z.string().min(1, "title is required.").max(255),
  rationale: z.string().max(5000).nullish(),
  outcome: z.string().max(5000).nullish(),
  status: z.enum(DECISION_STATUS).optional(),
  decidedAt: dateString.nullish(),
  meetingId: z.string().nullish(),
  labelIds: z.array(z.string()).optional(),
});

export const DecisionUpdateSchema = DecisionCreateSchema.partial();
