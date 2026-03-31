/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { z } from "zod";

const OllamaOptionsSchema = z
  .object({
    temperature: z.number().min(0).max(2),
    top_p: z.number().min(0).max(1),
    top_k: z.number().int().min(1).max(200),
    num_ctx: z.number().int().min(128).max(131072),
    repeat_penalty: z.number().min(0).max(5),
  })
  .strict();

const ScheduledNotifPrefsSchema = z
  .object({
    briefing: z.enum(["off", "daily", "weekly"]),
    tasksOverdue: z.enum(["off", "daily"]),
    meetingFollowup: z.enum(["off", "on"]),
    weeklyDigest: z.enum(["off", "on"]),
  })
  .strict();

export const UserPreferencesPatchSchema = z
  .object({
    language: z.enum(["de", "en"]),
    assistantName: z.string().min(1).max(64),
    systemPrompt: z.string().max(4000),
    responseStyle: z.enum(["concise", "detailed", "formal", "casual"]),
    ollamaOptions: OllamaOptionsSchema,
    scheduledNotifications: ScheduledNotifPrefsSchema,
  })
  .partial()
  .strict();
