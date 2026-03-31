import { z } from "zod";

const TASK_STATUS = ["open", "in_progress", "done", "cancelled"] as const;
const TASK_PRIORITY = ["low", "normal", "high", "urgent"] as const;

const dateString = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), {
    message: "Must be a valid date string.",
  });

export const TaskCreateSchema = z.object({
  title: z.string().min(1, "title is required.").max(255),
  notes: z.string().max(5000).nullish(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueDate: dateString.nullish(),
  meetingId: z.string().nullish(),
});

export const TaskUpdateSchema = TaskCreateSchema.partial();
