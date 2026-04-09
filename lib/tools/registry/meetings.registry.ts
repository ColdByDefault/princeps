/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const meetingTools: ToolRegistryEntry[] = [
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
    group: "meetings",
    type: "function",
    function: {
      name: "generate_meeting_prep_pack",
      description:
        "Generate or regenerate the AI-written prep pack for a specific meeting. Calling this on a meeting that already has a prep pack will replace it with a freshly generated one. The prep pack contains: meeting goal, key context, participant overview, open linked items, suggested talking points, and questions to resolve. Use when the user asks to prepare for a meeting, generate a brief, regenerate, or refresh the prep pack.",
      parameters: {
        type: "object",
        properties: {
          meetingId: {
            type: "string",
            description:
              "ID of the meeting to generate the prep pack for. Use list_meetings to find the ID if you don't have it.",
          },
        },
        required: ["meetingId"],
      },
    },
  },
  {
    minTier: "pro",
    group: "meetings",
    type: "function",
    function: {
      name: "get_meeting_prep_pack",
      description:
        "Read the current prep pack content for a specific meeting. Use when the user asks to see, show, or read the prep pack for a meeting. Returns null if no prep pack has been generated yet.",
      parameters: {
        type: "object",
        properties: {
          meetingId: {
            type: "string",
            description:
              "ID of the meeting whose prep pack you want to read. Use list_meetings to find the ID if you don't have it.",
          },
        },
        required: ["meetingId"],
      },
    },
  },
  {
    minTier: "pro",
    group: "meetings",
    type: "function",
    function: {
      name: "clear_meeting_prep_pack",
      description:
        "Delete (clear) the prep pack for a specific meeting. Use when the user explicitly asks to remove, delete, or clear the prep pack. Requires confirmation — ask the user before calling this.",
      parameters: {
        type: "object",
        properties: {
          meetingId: {
            type: "string",
            description: "ID of the meeting whose prep pack should be cleared.",
          },
        },
        required: ["meetingId"],
      },
    },
  },
  {
    minTier: "pro",
    group: "meetings",
    type: "function",
    function: {
      name: "update_meeting_prep_pack",
      description:
        "Manually edit or update the prep pack text for a specific meeting. Use when the user wants to make specific changes to an existing prep pack — e.g. add a note, rewrite a section, or correct something. To replace the whole pack with a freshly AI-generated version, use generate_meeting_prep_pack instead.",
      parameters: {
        type: "object",
        properties: {
          meetingId: {
            type: "string",
            description: "ID of the meeting whose prep pack should be updated.",
          },
          content: {
            type: "string",
            description:
              "The full updated prep pack content in Markdown. This replaces the existing text entirely, so include all sections you want to keep.",
          },
        },
        required: ["meetingId", "content"],
      },
    },
  },
];
