/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */ 

import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeOptionalText } from "@/lib/security";

const meetingStatusSchema = z.enum(["planned", "completed", "cancelled"]);
const actionItemStatusSchema = z.enum(["open", "done", "cancelled"]);
const decisionStatusSchema = z.enum(["active", "superseded", "reversed"]);

const optionalDateInputSchema = z
  .union([z.string().trim().min(1).max(80), z.null()])
  .optional()
  .refine(
    (value) => value == null || !Number.isNaN(new Date(value).getTime()),
    "Invalid date value",
  );

const meetingParticipantInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).nullish(),
  email: z.string().trim().email().max(320).nullish(),
  notes: z.string().trim().max(2_000).nullish(),
});

const meetingActionItemInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(4_000).nullish(),
  assigneeName: z.string().trim().max(120).nullish(),
  dueAt: optionalDateInputSchema,
  status: actionItemStatusSchema.optional(),
  completedAt: optionalDateInputSchema,
});

const decisionInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  rationale: z.string().trim().max(4_000).nullish(),
  outcome: z.string().trim().max(4_000).nullish(),
  status: decisionStatusSchema.optional(),
  decidedAt: optionalDateInputSchema,
});

export const createMeetingInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  objective: z.string().trim().max(1_000).nullish(),
  scheduledAt: optionalDateInputSchema,
  durationMinutes: z.number().int().min(1).max(1_440).nullish(),
  location: z.string().trim().max(160).nullish(),
  status: meetingStatusSchema.optional(),
  prepNotes: z.string().trim().max(8_000).nullish(),
  prepBrief: z.string().trim().max(16_000).nullish(),
  summary: z.string().trim().max(12_000).nullish(),
  nextSteps: z.string().trim().max(8_000).nullish(),
  participants: z.array(meetingParticipantInputSchema).max(24).optional(),
  actionItems: z.array(meetingActionItemInputSchema).max(50).optional(),
  decisions: z.array(decisionInputSchema).max(50).optional(),
});

export const updateMeetingInputSchema = createMeetingInputSchema.partial();

export const meetingListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: meetingStatusSchema.optional(),
});

export function validateMeetingId(meetingId: string) {
  const result = z.string().uuid().safeParse(meetingId);

  if (!result.success) {
    throw new Error("Invalid meeting id");
  }

  return result.data;
}

function toDateOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

function normalizeParticipant(
  input: z.infer<typeof meetingParticipantInputSchema>,
) {
  return {
    name: input.name.trim(),
    role: normalizeOptionalText(input.role, 120),
    email: input.email?.trim().toLowerCase() ?? null,
    notes: normalizeOptionalText(input.notes, 2_000),
  };
}

function normalizeActionItem(
  input: z.infer<typeof meetingActionItemInputSchema>,
) {
  return {
    title: input.title.trim(),
    notes: normalizeOptionalText(input.notes, 4_000),
    assigneeName: normalizeOptionalText(input.assigneeName, 120),
    dueAt: toDateOrNull(input.dueAt),
    status: input.status ?? "open",
    completedAt: toDateOrNull(input.completedAt),
  };
}

function normalizeDecision(input: z.infer<typeof decisionInputSchema>) {
  return {
    title: input.title.trim(),
    rationale: normalizeOptionalText(input.rationale, 4_000),
    outcome: normalizeOptionalText(input.outcome, 4_000),
    status: input.status ?? "active",
    decidedAt: toDateOrNull(input.decidedAt),
  };
}

type NormalizedMeetingParticipant = ReturnType<typeof normalizeParticipant>;
type NormalizedMeetingActionItem = ReturnType<typeof normalizeActionItem>;
type NormalizedDecision = ReturnType<typeof normalizeDecision>;

export interface NormalizedCreateMeetingInput {
  title: string;
  objective: string | null;
  scheduledAt: Date | null;
  durationMinutes: number | null;
  location: string | null;
  status: z.infer<typeof meetingStatusSchema>;
  prepNotes: string | null;
  prepBrief: string | null;
  summary: string | null;
  nextSteps: string | null;
  participants: NormalizedMeetingParticipant[];
  actionItems: NormalizedMeetingActionItem[];
  decisions: NormalizedDecision[];
}

export interface NormalizedUpdateMeetingInput {
  title?: string;
  objective?: string | null;
  scheduledAt?: Date | null;
  durationMinutes?: number | null;
  location?: string | null;
  status?: z.infer<typeof meetingStatusSchema>;
  prepNotes?: string | null;
  prepBrief?: string | null;
  summary?: string | null;
  nextSteps?: string | null;
  participants?: NormalizedMeetingParticipant[];
  actionItems?: NormalizedMeetingActionItem[];
  decisions?: NormalizedDecision[];
}

export function normalizeCreateMeetingInput(
  input: z.infer<typeof createMeetingInputSchema>,
): NormalizedCreateMeetingInput {
  return {
    title: input.title.trim(),
    objective: normalizeOptionalText(input.objective, 1_000),
    scheduledAt: toDateOrNull(input.scheduledAt),
    durationMinutes: input.durationMinutes ?? null,
    location: normalizeOptionalText(input.location, 160),
    status: input.status ?? "planned",
    prepNotes: normalizeOptionalText(input.prepNotes, 8_000),
    prepBrief: normalizeOptionalText(input.prepBrief, 16_000),
    summary: normalizeOptionalText(input.summary, 12_000),
    nextSteps: normalizeOptionalText(input.nextSteps, 8_000),
    participants: (input.participants ?? []).map(normalizeParticipant),
    actionItems: (input.actionItems ?? []).map(normalizeActionItem),
    decisions: (input.decisions ?? []).map(normalizeDecision),
  };
}

export function normalizeUpdateMeetingInput(
  input: z.infer<typeof updateMeetingInputSchema>,
): NormalizedUpdateMeetingInput {
  const data: NormalizedUpdateMeetingInput = {};

  if (input.title !== undefined) {
    data.title = input.title.trim();
  }

  if (input.objective !== undefined) {
    data.objective = normalizeOptionalText(input.objective, 1_000);
  }

  if (input.scheduledAt !== undefined) {
    data.scheduledAt = toDateOrNull(input.scheduledAt);
  }

  if (input.durationMinutes !== undefined) {
    data.durationMinutes = input.durationMinutes ?? null;
  }

  if (input.location !== undefined) {
    data.location = normalizeOptionalText(input.location, 160);
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.prepNotes !== undefined) {
    data.prepNotes = normalizeOptionalText(input.prepNotes, 8_000);
  }

  if (input.prepBrief !== undefined) {
    data.prepBrief = normalizeOptionalText(input.prepBrief, 16_000);
  }

  if (input.summary !== undefined) {
    data.summary = normalizeOptionalText(input.summary, 12_000);
  }

  if (input.nextSteps !== undefined) {
    data.nextSteps = normalizeOptionalText(input.nextSteps, 8_000);
  }

  if (input.participants !== undefined) {
    data.participants = input.participants.map(normalizeParticipant);
  }

  if (input.actionItems !== undefined) {
    data.actionItems = input.actionItems.map(normalizeActionItem);
  }

  if (input.decisions !== undefined) {
    data.decisions = input.decisions.map(normalizeDecision);
  }

  return data;
}

export const meetingDetailSelect = {
  id: true,
  title: true,
  objective: true,
  scheduledAt: true,
  durationMinutes: true,
  location: true,
  status: true,
  prepNotes: true,
  prepBrief: true,
  summary: true,
  nextSteps: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  actionItems: {
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      notes: true,
      assigneeName: true,
      dueAt: true,
      status: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  decisions: {
    orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      rationale: true,
      outcome: true,
      status: true,
      decidedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.MeetingSelect;

export const meetingListSelect = {
  id: true,
  title: true,
  objective: true,
  scheduledAt: true,
  status: true,
  updatedAt: true,
  _count: {
    select: {
      participants: true,
      actionItems: true,
      decisions: true,
    },
  },
} satisfies Prisma.MeetingSelect;

export async function requireMeetingForUser(userId: string, meetingId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  return meeting;
}
