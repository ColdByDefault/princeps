/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since beta
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const goalTools: ToolRegistryEntry[] = [
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
            description:
              "Optional ISO 8601 deadline for the goal (e.g. 2026-07-01T00:00:00Z). Include the time and Z suffix.",
          },
          labelNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Label names to attach. Created if they do not exist. Always include every label the user has mentioned or established as context — do not omit labels just because they were created earlier in the same run.",
          },
          milestones: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional list of milestone titles to create with the goal.",
          },
          taskIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Task IDs to link to this goal. Only pass IDs returned by create_task or list_tasks. Never pass decision IDs, meeting IDs, or any other entity IDs here.",
          },
          meetingId: {
            type: "string",
            description:
              "Optional ID or exact title of the meeting this goal originated from. Use the ID returned by create_meeting when creating a goal in the same run.",
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
        "Update an existing goal's title, description, status, target date, labels, linked tasks, or source meeting. Use list_goals to find the goalId first.",
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
              "Replacement label names. Replaces all existing labels. Always re-pass the full label set when updating — do not omit labels that should remain.",
          },
          taskIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of task IDs linked to this goal. Pass an empty array to unlink all tasks. Only pass IDs returned by create_task or list_tasks — never pass decision IDs, meeting IDs, or goal IDs here.",
          },
          meetingId: {
            type: "string",
            description:
              "ID or exact title of the meeting this goal originated from. Use to link the goal to its source meeting after creation.",
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
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "add_stakeholder",
      description:
        "Link a contact to a goal as a stakeholder with a role and relationship health. Use when the user says things like 'Marcus is a champion for this goal', 'add Lena as a blocker', or 'mark the CEO as sponsor'. Use list_goals to find the goalId.",
      parameters: {
        type: "object",
        properties: {
          contactName: {
            type: "string",
            description: "Name of the contact to add as a stakeholder. Must match an existing contact.",
          },
          goalId: {
            type: "string",
            description: "ID of the goal to link the stakeholder to. Omit for a global (goal-independent) stakeholder entry.",
          },
          role: {
            type: "string",
            description: "Role of the stakeholder, e.g. 'sponsor', 'blocker', 'champion', 'neutral', or any custom label.",
          },
          health: {
            type: "string",
            enum: ["warm", "neutral", "cold"],
            description: "Relationship health. 'warm' = supportive, 'cold' = at risk or opposed. Defaults to 'neutral'.",
          },
          notes: {
            type: "string",
            description: "Optional notes about this stakeholder's involvement.",
          },
        },
        required: ["contactName"],
      },
    },
  },
  {
    minTier: "free",
    group: "goals",
    type: "function",
    function: {
      name: "list_stakeholders",
      description:
        "List stakeholders linked to a goal or all stakeholders globally. Use when the user asks 'who are the stakeholders for this goal?' or 'show me the political map'.",
      parameters: {
        type: "object",
        properties: {
          goalId: {
            type: "string",
            description: "Filter by goal ID. Omit to list all stakeholders across all goals.",
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
      name: "update_stakeholder_health",
      description:
        "Update the health or role of an existing stakeholder entry. Use when the user says things like 'Marcus turned cold' or 'Lena is now a champion'.",
      parameters: {
        type: "object",
        properties: {
          stakeholderId: {
            type: "string",
            description: "ID of the stakeholder entry to update. Use list_stakeholders to find it.",
          },
          health: {
            type: "string",
            enum: ["warm", "neutral", "cold"],
            description: "Updated relationship health.",
          },
          role: {
            type: "string",
            description: "Updated role for the stakeholder.",
          },
          notes: {
            type: "string",
            description: "Updated notes.",
          },
        },
        required: ["stakeholderId"],
      },
    },
  },
];
