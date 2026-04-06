/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { LLMTool } from "@/types/llm";

/**
 * All tools the LLM can call, in OpenAI function-calling schema format.
 * To add a new tool: define it here and wire it in executor.ts.
 */
export const TOOL_REGISTRY: LLMTool[] = [
  {
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
        },
        required: ["name"],
      },
    },
  },
  {
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
        },
        required: ["labelName"],
      },
    },
  },
  {
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
];
