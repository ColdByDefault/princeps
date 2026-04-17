/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const taskTools: ToolRegistryEntry[] = [
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
            description:
              "Short task title — 3 to 7 words maximum. Never put full sentences or context in the title; use `notes` for details.",
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
          goalIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional list of goal IDs to link this task to. Use list_goals to find goal IDs first. Pass an empty array to remove all goal links.",
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
          goalIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Replacement set of goal IDs to link this task to. Pass an empty array to remove all goal links. Use list_goals to find goal IDs.",
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
];
