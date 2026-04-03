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
        },
        required: ["taskId"],
      },
    },
  },
];
