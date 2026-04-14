/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
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
              "Optional label names to attach. Created if they do not exist.",
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
              "Optional list of task IDs to link to this goal. Use list_tasks to find task IDs first.",
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
          taskIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of task IDs linked to this goal. Pass an empty array to unlink all tasks. Use list_tasks to find task IDs.",
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
];
