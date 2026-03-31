import { z } from "zod";

const MEETING_STATUS = ["upcoming", "done", "cancelled"] as const;

const dateString = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), {
    message: "Must be a valid date string.",
  });

export const MeetingCreateSchema = z.object({
  title: z.string().min(1, "title is required.").max(255),
  scheduledAt: z
    .string()
    .refine(
      (s) => !isNaN(Date.parse(s)),
      "scheduledAt must be a valid date string.",
    ),
  durationMin: z.number().int().min(1).max(1440).nullish(),
  location: z.string().max(500).nullish(),
  agenda: z.string().max(10000).nullish(),
  participantContactIds: z.array(z.string()).optional(),
});

export const MeetingUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  scheduledAt: dateString.optional(),
  durationMin: z.number().int().min(1).max(1440).nullish(),
  location: z.string().max(500).nullish(),
  agenda: z.string().max(10000).nullish(),
  summary: z.string().max(20000).nullish(),
  status: z.enum(MEETING_STATUS).optional(),
  participantContactIds: z.array(z.string()).optional(),
});
