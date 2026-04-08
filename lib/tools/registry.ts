/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LLMTool } from "@/types/llm";
import type { Tier } from "@/types/billing";

/**
 * A TOOL_REGISTRY entry — same shape as LLMTool but carries minTier and group metadata.
 * Strip minTier + group before passing to the LLM (use getToolsForTier).
 */
export type ToolRegistryEntry = LLMTool & { minTier: Tier; group: string };

/** Tier evaluation order — lower index = lower tier. */
const TIER_ORDER: Tier[] = ["free", "pro", "premium", "enterprise"];

/**
 * Returns the tools the LLM is allowed to call for the given tier,
 * minus any the user has individually disabled.
 * The returned array is OpenAI-compatible (minTier is stripped).
 */
export function getToolsForTier(
  tier: Tier,
  disabledToolNames: string[] = [],
): LLMTool[] {
  const userIdx = TIER_ORDER.indexOf(tier);
  return TOOL_REGISTRY.filter(
    ({ minTier, function: fn }) =>
      TIER_ORDER.indexOf(minTier) <= userIdx &&
      !disabledToolNames.includes(fn.name),
  ).map(({ minTier: _m, group: _g, ...tool }) => tool as LLMTool);
}

/**
 * Fetches the user's tier + disabled tool preferences from the DB,
 * then returns the filtered LLMTool list ready to pass to the LLM.
 */
export async function getActiveToolsForUser(
  userId: string,
): Promise<LLMTool[]> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true, preferences: true },
  });

  const tier = user.tier as Tier;
  let disabledTools: string[] = [];

  const prefs = user.preferences;
  if (typeof prefs === "object" && prefs !== null && !Array.isArray(prefs)) {
    const prefsObj = prefs as Record<string, unknown>;
    if (Array.isArray(prefsObj.disabledTools)) {
      disabledTools = (prefsObj.disabledTools as unknown[]).filter(
        (t): t is string => typeof t === "string",
      );
    }
  }

  return getToolsForTier(tier, disabledTools);
}

/**
 * All tools the LLM can call, in OpenAI function-calling schema format.
 * To add a new tool: define it here and wire it in executor.ts.
 */
export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "tasks",
    type: "function",
    function: {
      name: "create_task",
      description:
        "Create a new task for the user. Use this when the user asks to add, create, or schedule a task.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short, clear task title (required).",
          },
          notes: {
            type: "string",
            description: "Optional additional details or context.",
          },
          priority: {
            type: "string",
            enum: ["low", "normal", "high", "urgent"],
            description: "Task priority. Defaults to normal.",
          },
          dueDate: {
            type: "string",
            description:
              "Optional ISO 8601 due date (e.g. 2026-04-10T00:00:00Z).",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              'Optional list of label names to attach. Labels that don\'t exist yet will be created automatically. Use the exact name (e.g. "private", "work").',
          },
          meetingId: {
            type: "string",
            description:
              "Optional ID of a meeting to link this task to. Use list_meetings to find the meeting ID first.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    minTier: "free",
    group: "tasks",
    type: "function",
    function: {
      name: "list_tasks",
      description:
        "Retrieve the user's tasks, optionally filtered by status. Use this when the user asks what tasks they have, what's pending, or what's due.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "in_progress", "done", "cancelled"],
            description:
              "Filter by status. Omit to return all tasks regardless of status.",
          },
        },
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "tasks",
    type: "function",
    function: {
      name: "complete_task",
      description:
        "Mark a task as done. Use when the user says a task is finished, completed, or done.",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "The ID of the task to mark as done.",
          },
        },
        required: ["taskId"],
      },
    },
  },
  {
    minTier: "free",
    group: "tasks",
    type: "function",
    function: {
      name: "update_task",
      description:
        "Update a task's title, notes, priority, due date, or status.",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "The ID of the task to update.",
          },
          title: { type: "string", description: "New title." },
          notes: { type: "string", description: "New notes." },
          priority: {
            type: "string",
            enum: ["low", "normal", "high", "urgent"],
          },
          dueDate: {
            type: "string",
            description: "New ISO 8601 due date, or null to clear it.",
          },
          status: {
            type: "string",
            enum: ["open", "in_progress", "done", "cancelled"],
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Replaces all current labels on the task with the given names. Missing labels are created automatically. Pass an empty array to remove all labels.",
          },
          meetingId: {
            type: "string",
            description:
              "Link or unlink a meeting. Pass the meeting ID to link, or null to unlink from any meeting.",
          },
        },
        required: ["taskId"],
      },
    },
  },
  {
    minTier: "free",
    group: "tasks",
    type: "function",
    function: {
      name: "delete_task",
      description:
        "Permanently delete a task. Always ask the user to confirm before calling this tool. Requires the taskId — use list_tasks to find it first.",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task to delete.",
          },
        },
        required: ["taskId"],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "create_label",
      description:
        "Create a new global label. Use this when the user asks to add or create a label. Labels can then be attached to tasks and other records.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Label name (required, max 50 characters).",
          },
          color: {
            type: "string",
            description:
              "Hex color code (e.g. #6366f1). Defaults to #6366f1 if omitted.",
          },
          icon: {
            type: "string",
            description:
              "Optional icon name for the label. One of: Tag, Bookmark, Star, Heart, Flag, Zap, Flame, Circle, Diamond, Shield, Crown, Trophy, Gem, Briefcase, Lightbulb, Globe, Clock, Bell, Target, Rocket.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "list_labels",
      description:
        "Retrieve all labels the user has created. Use this when the user asks what labels exist, or before updating or deleting a label by name.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "update_label",
      description:
        "Rename or recolor an existing label. Use when the user asks to rename, edit, or change the color of a label.",
      parameters: {
        type: "object",
        properties: {
          labelName: {
            type: "string",
            description: "The current name of the label to update.",
          },
          newName: {
            type: "string",
            description: "New name for the label (optional).",
          },
          color: {
            type: "string",
            description: "New hex color code, e.g. #f43f5e (optional).",
          },
          icon: {
            type: "string",
            description:
              "New icon name (optional). One of: Tag, Bookmark, Star, Heart, Flag, Zap, Flame, Circle, Diamond, Shield, Crown, Trophy, Gem, Briefcase, Lightbulb, Globe, Clock, Bell, Target, Rocket. Pass null to remove the icon.",
          },
        },
        required: ["labelName"],
      },
    },
  },
  {
    minTier: "free",
    group: "labels",
    type: "function",
    function: {
      name: "delete_label",
      description:
        "Delete an existing label and remove it from all tasks it is attached to. Use when the user asks to remove or delete a label.",
      parameters: {
        type: "object",
        properties: {
          labelName: {
            type: "string",
            description: "The name of the label to delete.",
          },
        },
        required: ["labelName"],
      },
    },
  },
  {
    minTier: "free",
    group: "profile",
    type: "function",
    function: {
      name: "get_user_info",
      description:
        "Retrieve the current user's profile information: name, username, email, plan tier, role, timezone, and account creation date. Use this when the user asks about their own account, profile, or plan details.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // ── Contacts ─────────────────────────────────────────────────────────────
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "create_contact",
      description:
        "Create a new contact for the user. Provide at minimum a name. Optionally include role, company, email, phone, notes, lastContact (ISO date string), and labelNames (string array of label names to attach).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the contact." },
          role: {
            type: "string",
            description: "Job title or role of the contact.",
          },
          company: {
            type: "string",
            description: "Company or organisation the contact belongs to.",
          },
          email: { type: "string", description: "Email address." },
          phone: { type: "string", description: "Phone number." },
          notes: {
            type: "string",
            description: "Free-form notes about the contact.",
          },
          lastContact: {
            type: "string",
            description:
              "ISO 8601 date string for when the user last contacted this person.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Label names to attach. Labels will be created if they do not exist.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "list_contacts",
      description:
        "List all contacts for the current user. Returns names, roles, companies, emails, phone numbers, labels, and IDs needed for update/delete.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "update_contact",
      description:
        "Update an existing contact. Requires the contactId. Supply only the fields that should change. Passing labelNames replaces all existing labels on the contact.",
      parameters: {
        type: "object",
        properties: {
          contactId: {
            type: "string",
            description: "ID of the contact to update.",
          },
          name: { type: "string" },
          role: { type: "string" },
          company: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          notes: { type: "string" },
          lastContact: { type: "string", description: "ISO 8601 date string." },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of label names. Passing an empty array removes all labels.",
          },
        },
        required: ["contactId"],
      },
    },
  },
  {
    minTier: "free",
    group: "contacts",
    type: "function",
    function: {
      name: "delete_contact",
      description: "Permanently delete a contact. Requires the contactId.",
      parameters: {
        type: "object",
        properties: {
          contactId: {
            type: "string",
            description: "ID of the contact to delete.",
          },
        },
        required: ["contactId"],
      },
    },
  },
  // ── Meetings ─────────────────────────────────────────────────────────────
  {
    minTier: "free",
    group: "meetings",
    type: "function",
    function: {
      name: "create_meeting",
      description:
        "Create a new meeting for the user. Use when the user asks to schedule, add, or book a meeting. Requires a title and scheduled date/time.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short, clear meeting title (required).",
          },
          scheduledAt: {
            type: "string",
            description:
              "ISO 8601 date-time for when the meeting starts (e.g. 2026-04-10T14:00:00Z). Required.",
          },
          durationMin: {
            type: "number",
            description: "Duration in minutes (optional, e.g. 60).",
          },
          location: {
            type: "string",
            description:
              "Meeting location — room name, URL, or address (optional).",
          },
          agenda: {
            type: "string",
            description: "Meeting agenda text (optional).",
          },
          summary: {
            type: "string",
            description: "Meeting summary or notes (optional).",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Label names to attach. Labels will be created if they do not exist.",
          },
          participantContactIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Contact IDs to add as participants. If a participant name is mentioned and no contact exists yet, inform the user and offer to create the contact first before adding them.",
          },
        },
        required: ["title", "scheduledAt"],
      },
    },
  },
  {
    minTier: "free",
    group: "meetings",
    type: "function",
    function: {
      name: "list_meetings",
      description:
        "Retrieve the user's meetings, optionally filtered by status. Use when the user asks what meetings are coming up, what they have scheduled, or about past meetings.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["upcoming", "done", "cancelled"],
            description: "Filter by status. Omit to return all meetings.",
          },
        },
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "meetings",
    type: "function",
    function: {
      name: "update_meeting",
      description:
        "Update an existing meeting. Requires the meetingId. Supply only the fields that should change.",
      parameters: {
        type: "object",
        properties: {
          meetingId: {
            type: "string",
            description: "ID of the meeting to update.",
          },
          title: { type: "string", description: "New title." },
          scheduledAt: {
            type: "string",
            description: "New ISO 8601 date-time.",
          },
          durationMin: {
            type: "number",
            description: "New duration in minutes, or null to clear it.",
          },
          location: {
            type: "string",
            description: "New location, or null to clear it.",
          },
          status: {
            type: "string",
            enum: ["upcoming", "done", "cancelled"],
            description: "New status.",
          },
          agenda: {
            type: "string",
            description: "Meeting agenda text, or null to clear it.",
          },
          summary: {
            type: "string",
            description:
              "Meeting summary or notes after the fact, or null to clear it.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of label names. Pass an empty array to remove all labels.",
          },
          participantContactIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of participant contact IDs. Pass an empty array to remove all participants. If the user mentions a person not yet in contacts, inform them and suggest creating a contact first.",
          },
          linkedTaskIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of task IDs to link to this meeting. Pass an empty array to unlink all tasks. Use list_tasks to find task IDs first.",
          },
        },
        required: ["meetingId"],
      },
    },
  },
  {
    minTier: "free",
    group: "meetings",
    type: "function",
    function: {
      name: "delete_meeting",
      description: "Permanently delete a meeting. Requires the meetingId.",
      parameters: {
        type: "object",
        properties: {
          meetingId: {
            type: "string",
            description: "ID of the meeting to delete.",
          },
        },
        required: ["meetingId"],
      },
    },
  },
  {
    minTier: "pro",
    group: "decisions",
    type: "function",
    function: {
      name: "create_decision",
      description:
        "Record a new decision. Use when the user wants to log, capture, or document a decision they are considering or have made.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short, clear description of the decision (required).",
          },
          rationale: {
            type: "string",
            description:
              "Optional explanation of why this decision is being considered or was made.",
          },
          outcome: {
            type: "string",
            description: "Optional description of what was decided.",
          },
          status: {
            type: "string",
            enum: ["open", "decided", "reversed"],
            description: "Decision status. Defaults to open.",
          },
          decidedAt: {
            type: "string",
            description:
              "Optional ISO 8601 date when the decision was made (e.g. 2026-04-10T00:00:00Z).",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional list of label names to attach. Labels that don't exist yet will be created automatically.",
          },
          meetingId: {
            type: "string",
            description:
              "Optional ID of a meeting this decision came from. Use list_meetings to find the meeting ID first.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    minTier: "pro",
    group: "decisions",
    type: "function",
    function: {
      name: "list_decisions",
      description:
        "Retrieve the user's decisions, optionally filtered by status. Use when the user asks what decisions they have, what is pending, or what was decided.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "decided", "reversed"],
            description: "Filter by status. Omit to return all decisions.",
          },
        },
        required: [],
      },
    },
  },
  {
    minTier: "pro",
    group: "decisions",
    type: "function",
    function: {
      name: "update_decision",
      description:
        "Update an existing decision's title, rationale, outcome, status, or labels. Use list_decisions to find the decisionId first.",
      parameters: {
        type: "object",
        properties: {
          decisionId: {
            type: "string",
            description: "ID of the decision to update.",
          },
          title: {
            type: "string",
            description: "New title for the decision.",
          },
          rationale: {
            type: "string",
            description: "Updated rationale.",
          },
          outcome: {
            type: "string",
            description: "Updated outcome describing what was decided.",
          },
          status: {
            type: "string",
            enum: ["open", "decided", "reversed"],
            description: "New status for the decision.",
          },
          decidedAt: {
            type: "string",
            description: "ISO 8601 date when the decision was made.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Updated list of label names. Replaces existing labels.",
          },
        },
        required: ["decisionId"],
      },
    },
  },
  {
    minTier: "pro",
    group: "decisions",
    type: "function",
    function: {
      name: "delete_decision",
      description:
        "Permanently delete a decision. Always confirm with the user before calling this tool. Use list_decisions to find the decisionId first.",
      parameters: {
        type: "object",
        properties: {
          decisionId: {
            type: "string",
            description: "ID of the decision to delete.",
          },
        },
        required: ["decisionId"],
      },
    },
  },
  // ─── Goals ────────────────────────────────────────────────
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "create_goal",
      description:
        "Create a new goal for the user. Use when the user asks to set, add, or create a goal or objective. Goals can have milestones (checkpoints) and linked tasks.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short title for the goal.",
          },
          description: {
            type: "string",
            description: "Optional longer description or context for the goal.",
          },
          status: {
            type: "string",
            enum: ["open", "in_progress", "done", "cancelled"],
            description: "Initial status. Defaults to 'open'.",
          },
          targetDate: {
            type: "string",
            description: "Optional ISO 8601 deadline for the goal.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional label names to attach. Created if they do not exist.",
          },
          milestones: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional list of milestone titles to create with the goal.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "list_goals",
      description:
        "List the user's goals. Optionally filter by status. Use to find a goalId before updating or deleting.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "in_progress", "done", "cancelled"],
            description: "Filter by status. Omit to return all goals.",
          },
        },
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "update_goal",
      description:
        "Update an existing goal's title, description, status, target date, or labels. Use list_goals to find the goalId first.",
      parameters: {
        type: "object",
        properties: {
          goalId: {
            type: "string",
            description: "ID of the goal to update.",
          },
          title: {
            type: "string",
            description: "Updated title.",
          },
          description: {
            type: "string",
            description: "Updated description.",
          },
          status: {
            type: "string",
            enum: ["open", "in_progress", "done", "cancelled"],
            description: "Updated status.",
          },
          targetDate: {
            type: "string",
            description: "Updated ISO 8601 deadline.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement label names. Replaces all existing labels.",
          },
        },
        required: ["goalId"],
      },
    },
  },
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "delete_goal",
      description:
        "Permanently delete a goal and all its milestones. Always confirm with the user before calling this tool. Use list_goals to find the goalId first.",
      parameters: {
        type: "object",
        properties: {
          goalId: {
            type: "string",
            description: "ID of the goal to delete.",
          },
        },
        required: ["goalId"],
      },
    },
  },
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "add_goal_milestone",
      description:
        "Add a new milestone (checkpoint) to an existing goal. Use list_goals to find the goalId first.",
      parameters: {
        type: "object",
        properties: {
          goalId: {
            type: "string",
            description: "ID of the goal to add a milestone to.",
          },
          title: {
            type: "string",
            description: "Title of the milestone.",
          },
        },
        required: ["goalId", "title"],
      },
    },
  },
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "complete_goal_milestone",
      description:
        "Mark a goal milestone as completed (or uncompleted). Use list_goals to find the goalId and milestoneId.",
      parameters: {
        type: "object",
        properties: {
          goalId: {
            type: "string",
            description: "ID of the goal that owns the milestone.",
          },
          milestoneId: {
            type: "string",
            description: "ID of the milestone to toggle.",
          },
          completed: {
            type: "boolean",
            description: "Set to true to mark completed, false to unmark.",
          },
        },
        required: ["goalId", "milestoneId"],
      },
    },
  },
  // ── Knowledge ─────────────────────────────────────────────────────────────
  {
    minTier: "free",
    group: "knowledge",
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Search the user's personal knowledge base using semantic similarity. Use this when the user asks about something they may have uploaded, references a document, or asks a question that could be answered by their stored knowledge. Returns the most relevant text excerpts along with the source document name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The natural-language question or topic to search for. Be specific — better queries yield better results.",
          },
          topK: {
            type: "number",
            description:
              "Maximum number of results to return (1–10). Defaults to 5. Use a lower value for focused lookups, higher for broad research.",
          },
        },
        required: ["query"],
      },
    },
  },
  // ─── Memory ───────────────────────────────────────────────
  {
    minTier: "free",
    group: "memory",
    type: "function",
    function: {
      name: "remember_fact",
      description:
        "Store a fact about the user in long-term memory. Use this when the user shares information they want remembered (e.g. preferences, personal details, goals). Always confirm the stored key and value in your reply.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description:
              'Brief topic label for the fact (e.g. "job title", "preferred language", "dietary preference"). Max 100 characters.',
          },
          value: {
            type: "string",
            description: "The fact content to remember. Max 2000 characters.",
          },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    minTier: "free",
    group: "memory",
    type: "function",
    function: {
      name: "recall_facts",
      description:
        "Retrieve all facts stored in the user's long-term memory. Use this when you need context about the user that is not in the current conversation.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "memory",
    type: "function",
    function: {
      name: "forget_fact",
      description:
        "Delete a specific fact from the user's long-term memory by its ID. Use recall_facts first to find the correct entry ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the memory entry to delete.",
          },
        },
        required: ["id"],
      },
    },
  },
];
