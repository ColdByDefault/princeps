/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
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
        "Create a meeting or appointment for the user. Use when the user asks to schedule, add, or book a future meeting, or when they share a recap of a meeting that already happened and it should be saved as a meeting record. Requires a title and scheduled date/time. For past meeting recaps, set status to done. If the recap mentions attendees, create their contacts first (create_contact), then pass the returned contact IDs in participantContactIds on this call — do not skip participants and rely on update_meeting to add them later. If labels apply, include them in labelNames on this call. If a recap also mentions a future follow-up, create a separate upcoming meeting for the follow-up instead of reusing or rescheduling the recap meeting. Only set pushToGoogle to true if the user explicitly asks to sync to Google Calendar.",
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
          status: {
            type: "string",
            enum: ["upcoming", "done", "cancelled"],
            description:
              "Initial status. Use done when saving a recap for a meeting that already happened. Defaults to upcoming.",
          },
          kind: {
            type: "string",
            enum: ["meeting", "appointment"],
            description:
              'Initial event kind: "meeting" for collaborative meetings, "appointment" for personal appointments. Defaults to meeting.',
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
              "Label names to attach. Labels will be created if they do not exist. Always include every label the user has mentioned or established as context for this work — do not omit labels just because they were created earlier in the same run.",
          },
          participantContactIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Contact IDs or exact contact names to add as participants. If a participant name is mentioned and no contact exists yet, create the contact first before adding them. Always pass this field when the user has named attendees — use the ID returned by create_contact when you created the contact in the same run.",
          },
          pushToGoogle: {
            type: "boolean",
            description:
              "Set to true ONLY when the user explicitly asks to sync or add this meeting to Google Calendar. Do NOT set this by default.",
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
        "Update an existing meeting. Requires the meetingId. Supply only the fields that should change. Do not use this to turn a past recap meeting into a future follow-up meeting; create a separate upcoming meeting instead.",
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
          kind: {
            type: "string",
            enum: ["meeting", "appointment"],
            description:
              'Change event kind: "meeting" for collaborative meetings, "appointment" for personal appointments.',
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
              "Replacement set of label names. Pass an empty array to remove all labels. When updating a meeting to link participants or tasks, always re-pass the full label set so it is not lost.",
          },
          participantContactIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of participant contact IDs or exact contact names. Pass an empty array to remove all participants. If the user mentions a person not yet in contacts, create the contact first. Always populate this field on the update_meeting call that links participants — use the IDs returned by create_contact.",
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
