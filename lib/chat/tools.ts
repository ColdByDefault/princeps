/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createContact } from "@/lib/contacts/create.logic";
import { createMeeting } from "@/lib/meetings/create.logic";
import { updateMeeting } from "@/lib/meetings/update.logic";
import { createTask } from "@/lib/tasks/create.logic";
import { createDecision } from "@/lib/decisions/create.logic";
import { createShareToken } from "@/lib/share/create.logic";
import {
  SHAREABLE_FIELD_KEYS,
  type ShareableFieldKey,
} from "@/lib/share/types";
import { db } from "@/lib/db";

import {
  type OllamaToolDefinition,
  type OllamaToolCallEntry as OllamaToolCall,
} from "@/lib/chat/ollama";

export type { OllamaToolDefinition, OllamaToolCall };

// ─── Tool result ──────────────────────────────────────────────────────────────

export type ActionResult = {
  /** Matches one of the tool function names */
  name:
    | "create_contact"
    | "create_meeting"
    | "create_task"
    | "create_decision"
    | "link_contact_to_meeting"
    | "generate_share_link";
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
        "Creates a new contact in the user's contact list. Use when the user asks you to add or save a person as a contact. IMPORTANT: the contact's full name is required. If the user has not provided a name, ask for it before calling this tool. Do not guess or invent a name.",
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
        "Creates a new meeting in the user's meeting log. Use when the user asks you to schedule, add, or log a meeting. IMPORTANT: both a title and a scheduled date/time are required. If either is missing and cannot be confidently inferred from context, ask the user for the missing information before calling this tool. Do not invent a time. Optionally include participant names if the user mentions specific contacts who will attend.",
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
          participantNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Names of existing contacts to add as participants. Only include names the user explicitly mentioned.",
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
        "Creates a new task in the user's task list. Use when the user asks you to add, create, or track a task or action item. IMPORTANT: a short title describing the action is required. If the user's request is too vague to produce a clear title, ask for clarification before calling this tool.",
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
  {
    type: "function",
    function: {
      name: "create_decision",
      description:
        "Logs a decision in the user's decision log. Use when the user asks you to record, log, or save a decision they have made or are considering. IMPORTANT: a clear decision title is required. If the user has not provided enough context to name the decision, ask before calling this tool.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short decision label (required).",
          },
          rationale: {
            type: "string",
            description: "Why this decision was made.",
          },
          outcome: {
            type: "string",
            description: "What was decided or what happened.",
          },
          status: {
            type: "string",
            enum: ["open", "decided", "reversed"],
            description: "Decision status. Defaults to open.",
          },
          decidedAt: {
            type: "string",
            description: "ISO 8601 date string for when the decision was made.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "link_contact_to_meeting",
      description:
        "Links one or more existing contacts to an existing meeting as participants. Use when the user wants to add contacts or attendees to a meeting that has already been created. IMPORTANT: both a meeting title and at least one contact name are required. Only use contact names the user explicitly provided — do not guess. If either is unclear, ask the user to clarify before calling this tool.",
      parameters: {
        type: "object",
        properties: {
          meetingTitle: {
            type: "string",
            description:
              "Title of the meeting to link contacts to (required). Used to find the meeting.",
          },
          contactNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Names of existing contacts to add as participants (required).",
          },
        },
        required: ["meetingTitle", "contactNames"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_share_link",
      description:
        "Generates a 24-hour public share link containing the user's contact card. Use when the user asks to share their contact info, create a share link, or generate a link with their details. Ask the user which fields to include if not specified. Valid fields are: name, email, jobTitle, company, location, bio, phone.",
      parameters: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: { type: "string" },
            description:
              "List of fields to include in the card. Valid values: name, email, jobTitle, company, location, bio, phone.",
          },
        },
        required: ["fields"],
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
      return {
        action: null,
        summary:
          "Contact creation failed: no name was provided. Tell the user that a contact name is required and ask them for it.",
      };
    }

    // Deduplication: skip if a contact with the same name already exists
    const existing = await db.contact.findFirst({
      where: { userId, name: { equals: a.name.trim(), mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (existing) {
      return {
        action: null,
        summary: `A contact named "${existing.name}" already exists in the user's contact list. Tell the user this contact already exists and ask if they want to update it or add a different one instead.`,
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
      participantNames?: unknown;
    };

    if (typeof a.title !== "string" || !a.title.trim()) {
      return {
        action: null,
        summary:
          "Meeting creation failed: no title was provided. Tell the user that a meeting title is required and ask them for it.",
      };
    }

    if (typeof a.scheduledAt !== "string") {
      return {
        action: null,
        summary:
          "Meeting creation failed: no date or time was specified. Tell the user that a scheduled date and time are required and ask them when the meeting is.",
      };
    }

    const scheduledAt = new Date(a.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      return {
        action: null,
        summary:
          "Meeting creation failed: the date or time provided could not be understood. Tell the user the date was invalid and ask them to provide a clear date and time.",
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
        summary: `A meeting titled "${existingMeeting.title}" already exists at that time. Tell the user this meeting already exists and ask if they meant a different time or a different meeting.`,
      };
    }

    // Resolve participant names to contact IDs
    const participantContactIds: string[] = [];
    const unresolvedParticipants: string[] = [];
    if (Array.isArray(a.participantNames)) {
      for (const pName of a.participantNames) {
        if (typeof pName !== "string" || !pName.trim()) continue;
        const contact = await db.contact.findFirst({
          where: {
            userId,
            name: { equals: pName.trim(), mode: "insensitive" },
          },
          select: { id: true },
        });
        if (contact) {
          participantContactIds.push(contact.id);
        } else {
          unresolvedParticipants.push(pName.trim());
        }
      }
    }

    const record = await createMeeting(userId, {
      title: a.title.trim(),
      scheduledAt,
      durationMin:
        typeof a.durationMin === "number" ? Math.round(a.durationMin) : null,
      location: typeof a.location === "string" ? a.location : null,
      agenda: typeof a.agenda === "string" ? a.agenda : null,
      participantContactIds,
    });

    const linkedNames = record.participants.map((p) => p.contactName);
    const meetingSummaryParts: string[] = [
      `Meeting "${record.title}" created successfully`,
    ];
    if (linkedNames.length > 0)
      meetingSummaryParts.push(
        `linked participants: ${linkedNames.join(", ")}`,
      );
    if (unresolvedParticipants.length > 0)
      meetingSummaryParts.push(
        `the following names were NOT found in contacts and could not be linked: ${unresolvedParticipants.join(", ")}. Inform the user and ask ONLY this: would they like to save ${unresolvedParticipants.length === 1 ? `"${unresolvedParticipants[0]}"` : "these people"} as a new contact? Do not suggest email, invitations, or any other action.`,
      );

    return {
      action: {
        name: "create_meeting",
        record: record as unknown as Record<string, unknown>,
      },
      summary: meetingSummaryParts.join("; "),
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
      return {
        action: null,
        summary:
          "Task creation failed: no title was provided. Tell the user that a task title is required and ask them to describe the task.",
      };
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
        summary: `A task titled "${existingTask.title}" already exists and is still open. Tell the user this task already exists and ask if they want to add a separate task or if this was already captured.`,
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

  if (name === "create_decision") {
    const a = args as {
      title?: unknown;
      rationale?: unknown;
      outcome?: unknown;
      status?: unknown;
      decidedAt?: unknown;
    };

    if (typeof a.title !== "string" || !a.title.trim()) {
      return {
        action: null,
        summary:
          "Decision creation failed: no title was provided. Tell the user that a decision title is required and ask them to name or describe the decision.",
      };
    }

    // Deduplication: skip if an open decision with the same title already exists
    const existingDecision = await db.decision.findFirst({
      where: {
        userId,
        title: { equals: a.title.trim(), mode: "insensitive" },
        status: "open",
      },
      select: { id: true, title: true },
    });
    if (existingDecision) {
      return {
        action: null,
        summary: `A decision titled "${existingDecision.title}" is already open in the decision log. Tell the user this decision already exists and ask if they want to update it or log a separate entry.`,
      };
    }

    const VALID_STATUSES = new Set(["open", "decided", "reversed"]);
    const status =
      typeof a.status === "string" && VALID_STATUSES.has(a.status)
        ? a.status
        : "open";

    const decidedAtRaw =
      typeof a.decidedAt === "string" ? new Date(a.decidedAt) : null;
    const decidedAt =
      decidedAtRaw && !isNaN(decidedAtRaw.getTime()) ? decidedAtRaw : null;

    const record = await createDecision(userId, {
      title: a.title.trim(),
      rationale: typeof a.rationale === "string" ? a.rationale : null,
      outcome: typeof a.outcome === "string" ? a.outcome : null,
      status,
      decidedAt,
    });

    return {
      action: {
        name: "create_decision",
        record: record as unknown as Record<string, unknown>,
      },
      summary: JSON.stringify({ id: record.id, title: record.title }),
    };
  }

  if (name === "link_contact_to_meeting") {
    const a = args as {
      meetingTitle?: unknown;
      contactNames?: unknown;
    };

    if (typeof a.meetingTitle !== "string" || !a.meetingTitle.trim()) {
      return {
        action: null,
        summary:
          "Linking failed: no meeting title was provided. Tell the user that a meeting title is required to identify which meeting to link contacts to.",
      };
    }

    if (!Array.isArray(a.contactNames) || a.contactNames.length === 0) {
      return {
        action: null,
        summary:
          "Linking failed: no contact names were provided. Tell the user that at least one contact name is required.",
      };
    }

    // Find the meeting by title (most recent match)
    const meeting = await db.meeting.findFirst({
      where: {
        userId,
        title: { equals: a.meetingTitle.trim(), mode: "insensitive" },
      },
      include: { participants: { select: { contactId: true } } },
      orderBy: { scheduledAt: "desc" },
    });

    if (!meeting) {
      return {
        action: null,
        summary: `No meeting titled "${a.meetingTitle.trim()}" was found. Tell the user that no meeting with that title exists and ask them to double-check the meeting title.`,
      };
    }

    // Resolve contact names and merge with existing participants
    const existingIds = new Set(meeting.participants.map((p) => p.contactId));
    const mergedIds: string[] = [...existingIds];
    const linked: string[] = [];
    const alreadyLinked: string[] = [];
    const notFound: string[] = [];

    for (const cName of a.contactNames) {
      if (typeof cName !== "string" || !cName.trim()) continue;
      const contact = await db.contact.findFirst({
        where: {
          userId,
          name: { equals: cName.trim(), mode: "insensitive" },
        },
        select: { id: true, name: true },
      });
      if (!contact) {
        notFound.push(cName.trim());
      } else if (existingIds.has(contact.id)) {
        alreadyLinked.push(contact.name);
      } else {
        mergedIds.push(contact.id);
        linked.push(contact.name);
      }
    }

    if (linked.length === 0) {
      const parts: string[] = [];
      if (alreadyLinked.length > 0)
        parts.push(
          `${alreadyLinked.join(", ")} ${
            alreadyLinked.length === 1 ? "is" : "are"
          } already a participant`,
        );
      if (notFound.length > 0)
        parts.push(
          `${notFound.join(", ")} ${
            notFound.length === 1 ? "was" : "were"
          } not found in the contact list`,
        );
      return {
        action: null,
        summary: `No new participants were added to "${meeting.title}". ${parts.join("; ")}. Tell the user what happened.`,
      };
    }

    const updated = await updateMeeting(userId, meeting.id, {
      participantContactIds: mergedIds,
    });

    if (!updated) {
      return {
        action: null,
        summary:
          "Failed to update the meeting. Tell the user the link could not be saved and to try again.",
      };
    }

    const linkSummaryParts: string[] = [
      `Successfully linked ${linked.join(", ")} to "${meeting.title}"`,
    ];
    if (alreadyLinked.length > 0)
      linkSummaryParts.push(
        `${alreadyLinked.join(", ")} were already participants`,
      );
    if (notFound.length > 0)
      linkSummaryParts.push(
        `${notFound.join(", ")} were not found in the contact list — tell the user`,
      );

    return {
      action: {
        name: "link_contact_to_meeting",
        record: updated as unknown as Record<string, unknown>,
      },
      summary: linkSummaryParts.join("; "),
    };
  }
  if (name === "generate_share_link") {
    const a = args as { fields?: unknown };

    if (!Array.isArray(a.fields) || a.fields.length === 0) {
      return {
        action: null,
        summary:
          "Share link generation failed: no fields were specified. Ask the user which fields (name, email, jobTitle, company, location, bio, phone) they want to include.",
      };
    }

    const validSet = new Set<string>(SHAREABLE_FIELD_KEYS);
    const fields = (a.fields as unknown[]).filter(
      (f): f is ShareableFieldKey => typeof f === "string" && validSet.has(f),
    );

    if (fields.length === 0) {
      return {
        action: null,
        summary:
          "Share link generation failed: none of the specified fields are valid. Valid fields are: name, email, jobTitle, company, location, bio, phone. Ask the user to pick from those.",
      };
    }

    const token = await createShareToken(userId, fields);
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/share/${token.id}`;

    return {
      action: {
        name: "generate_share_link",
        record: {
          id: token.id,
          fields,
          expiresAt: token.expiresAt,
        } as unknown as Record<string, unknown>,
      },
      summary: `Share link generated successfully. URL: ${shareUrl} — Tell the user their link is ready, share the URL with them, and mention it expires in 24 hours.`,
    };
  }
  return { action: null, summary: `{"error":"unknown tool \\"${name}\\""}` };
}
