/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createContact } from "@/lib/contacts/create.logic";
import { createMeeting } from "@/lib/meetings/create.logic";
import { createTask } from "@/lib/tasks/create.logic";
import { db } from "@/lib/db";

import {
  type OllamaToolDefinition,
  type OllamaToolCallEntry as OllamaToolCall,
} from "@/lib/chat/ollama";

export type { OllamaToolDefinition, OllamaToolCall };

// ─── Tool result ──────────────────────────────────────────────────────────────

export type ActionResult = {
  /** Matches one of the tool function names */
  name: "create_contact" | "create_meeting" | "create_task";
  /** The persisted record returned by the logic layer */
  record: Record<string, unknown>;
};

// ─── Tool definitions (sent to Ollama) ───────────────────────────────────────

export const CHAT_TOOLS: OllamaToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_contact",
      description:
        "Creates a new contact in the user's contact list. Use when the user asks you to add or save a person as a contact.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Full name of the contact (required).",
          },
          role: { type: "string", description: "Job title or role." },
          company: { type: "string", description: "Company or organization." },
          email: { type: "string", description: "Email address." },
          phone: { type: "string", description: "Phone number." },
          notes: {
            type: "string",
            description: "Free-form notes about the contact.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorizing the contact.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_meeting",
      description:
        "Creates a new meeting in the user's meeting log. Use when the user asks you to schedule, add, or log a meeting.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Meeting title (required).",
          },
          scheduledAt: {
            type: "string",
            description:
              "ISO 8601 date-time string for when the meeting is scheduled (required). Infer the year from today's date when the user omits it.",
          },
          durationMin: {
            type: "number",
            description: "Duration in minutes.",
          },
          location: {
            type: "string",
            description: "Physical location or video link.",
          },
          agenda: {
            type: "string",
            description: "Meeting agenda or objectives.",
          },
        },
        required: ["title", "scheduledAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Creates a new task in the user's task list. Use when the user asks you to add, create, or track a task or action item.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short action description (required).",
          },
          notes: {
            type: "string",
            description: "Additional context or details.",
          },
          priority: {
            type: "string",
            enum: ["low", "normal", "high", "urgent"],
            description: "Task priority. Defaults to normal.",
          },
          dueDate: {
            type: "string",
            description: "ISO 8601 date-time string for the due date.",
          },
        },
        required: ["title"],
      },
    },
  },
];

// ─── Tool execution ───────────────────────────────────────────────────────────

/**
 * Executes a single tool call on behalf of the user.
 * Returns the persisted record (for the SSE action event) and a compact JSON
 * summary string to include as the tool-result message back to the LLM.
 */
export async function executeToolCall(
  userId: string,
  toolCall: OllamaToolCall,
): Promise<{ action: ActionResult | null; summary: string }> {
  const { name, arguments: args } = toolCall.function;

  if (name === "create_contact") {
    const a = args as {
      name?: unknown;
      role?: unknown;
      company?: unknown;
      email?: unknown;
      phone?: unknown;
      notes?: unknown;
      tags?: unknown;
    };

    if (typeof a.name !== "string" || !a.name.trim()) {
      return { action: null, summary: '{"error":"contact name is required"}' };
    }

    // Deduplication: skip if a contact with the same name already exists
    const existing = await db.contact.findFirst({
      where: { userId, name: { equals: a.name.trim(), mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (existing) {
      return {
        action: null,
        summary: JSON.stringify({
          skipped: true,
          reason: "contact already exists",
          id: existing.id,
          name: existing.name,
        }),
      };
    }

    const record = await createContact(userId, {
      name: a.name.trim(),
      role: typeof a.role === "string" ? a.role : null,
      company: typeof a.company === "string" ? a.company : null,
      email: typeof a.email === "string" ? a.email : null,
      phone: typeof a.phone === "string" ? a.phone : null,
      notes: typeof a.notes === "string" ? a.notes : null,
      tags: Array.isArray(a.tags)
        ? (a.tags as unknown[]).filter(
            (t): t is string => typeof t === "string",
          )
        : [],
    });

    return {
      action: {
        name: "create_contact",
        record: record as unknown as Record<string, unknown>,
      },
      summary: JSON.stringify({ id: record.id, name: record.name }),
    };
  }

  if (name === "create_meeting") {
    const a = args as {
      title?: unknown;
      scheduledAt?: unknown;
      durationMin?: unknown;
      location?: unknown;
      agenda?: unknown;
    };

    if (typeof a.title !== "string" || !a.title.trim()) {
      return { action: null, summary: '{"error":"meeting title is required"}' };
    }

    if (typeof a.scheduledAt !== "string") {
      return {
        action: null,
        summary: '{"error":"scheduledAt must be an ISO 8601 string"}',
      };
    }

    const scheduledAt = new Date(a.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return {
        action: null,
        summary: '{"error":"scheduledAt is not a valid date"}',
      };
    }

    // Deduplication: skip if a meeting with the same title exists within ±1 hour of the same time
    const windowStart = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000);
    const existingMeeting = await db.meeting.findFirst({
      where: {
        userId,
        title: { equals: a.title.trim(), mode: "insensitive" },
        scheduledAt: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, title: true },
    });
    if (existingMeeting) {
      return {
        action: null,
        summary: JSON.stringify({
          skipped: true,
          reason: "meeting already exists",
          id: existingMeeting.id,
          title: existingMeeting.title,
        }),
      };
    }

    const record = await createMeeting(userId, {
      title: a.title.trim(),
      scheduledAt,
      durationMin:
        typeof a.durationMin === "number" ? Math.round(a.durationMin) : null,
      location: typeof a.location === "string" ? a.location : null,
      agenda: typeof a.agenda === "string" ? a.agenda : null,
    });

    return {
      action: {
        name: "create_meeting",
        record: record as unknown as Record<string, unknown>,
      },
      summary: JSON.stringify({ id: record.id, title: record.title }),
    };
  }

  if (name === "create_task") {
    const a = args as {
      title?: unknown;
      notes?: unknown;
      priority?: unknown;
      dueDate?: unknown;
    };

    if (typeof a.title !== "string" || !a.title.trim()) {
      return { action: null, summary: '{"error":"task title is required"}' };
    }

    // Deduplication: skip if an open/in_progress task with the same title already exists
    const existingTask = await db.task.findFirst({
      where: {
        userId,
        title: { equals: a.title.trim(), mode: "insensitive" },
        status: { in: ["open", "in_progress"] },
      },
      select: { id: true, title: true },
    });
    if (existingTask) {
      return {
        action: null,
        summary: JSON.stringify({
          skipped: true,
          reason: "task already exists",
          id: existingTask.id,
          title: existingTask.title,
        }),
      };
    }

    const VALID_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
    const priority =
      typeof a.priority === "string" && VALID_PRIORITIES.has(a.priority)
        ? a.priority
        : "normal";

    const dueDateRaw =
      typeof a.dueDate === "string" ? new Date(a.dueDate) : null;
    const dueDate =
      dueDateRaw && !isNaN(dueDateRaw.getTime()) ? dueDateRaw : null;

    const record = await createTask(userId, {
      title: a.title.trim(),
      notes: typeof a.notes === "string" ? a.notes : null,
      priority,
      dueDate,
    });

    return {
      action: {
        name: "create_task",
        record: record as unknown as Record<string, unknown>,
      },
      summary: JSON.stringify({ id: record.id, title: record.title }),
    };
  }

  return { action: null, summary: `{"error":"unknown tool \\"${name}\\""}` };
}
