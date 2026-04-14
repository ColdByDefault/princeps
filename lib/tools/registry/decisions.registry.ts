/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const decisionTools: ToolRegistryEntry[] = [
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
              "Label names to attach. Labels that don't exist yet will be created automatically. Always include any labels that are being applied to other items in the same message — labels are not optional when the user has established a labeling context.",
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
          meetingId: {
            type: "string",
            description:
              "Link or unlink the meeting this decision originated from. Pass the meeting ID to link, or null to unlink. Use list_meetings to find the meeting ID.",
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
];
