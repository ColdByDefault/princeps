/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createTask } from "@/lib/tasks/create.logic";
import { listTasks } from "@/lib/tasks/list.logic";
import { updateTask } from "@/lib/tasks/update.logic";
import { createLabel } from "@/lib/labels/create.logic";
import { createTaskSchema, updateTaskSchema } from "@/lib/tasks/schemas";
import { createLabelSchema } from "@/lib/labels/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/tools/resolvers";
import type { LLMToolCall } from "@/types/llm";

export type ActionResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * Dispatches a single LLM tool call to the appropriate feature logic.
 * Any surface (chat, cron, webhook, agents) can call this.
 */
export async function executeToolCall(
  userId: string,
  toolCall: LLMToolCall,
): Promise<ActionResult> {
  let args: Record<string, unknown>;

  try {
    args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Invalid tool arguments: not valid JSON." };
  }

  const name = toolCall.function.name;

  if (name === "create_task") {
    // Resolve label names → IDs (creates missing labels automatically) before validation.
    const labelNames = Array.isArray(args.labelNames)
      ? (args.labelNames as string[])
      : [];
    const labelIds = labelNames.length
      ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
      : undefined;

    const parsed = createTaskSchema.safeParse({ ...args, labelIds });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid create_task input.",
      };
    }
    const task = await createTask(userId, parsed.data);
    return { ok: true, data: task };
  }

  if (name === "list_tasks") {
    const validStatuses = ["open", "in_progress", "done", "cancelled"] as const;
    type TaskStatus = (typeof validStatuses)[number];
    const status =
      typeof args.status === "string" &&
      validStatuses.includes(args.status as TaskStatus)
        ? (args.status as TaskStatus)
        : undefined;

    const tasks = await listTasks(userId, status ? { status } : {});
    return { ok: true, data: tasks };
  }

  if (name === "complete_task") {
    if (typeof args.taskId !== "string") {
      return { ok: false, error: "complete_task requires taskId." };
    }
    const result = await updateTask(args.taskId, userId, { status: "done" });
    if (!result.ok) {
      return {
        ok: false,
        error: result.notFound ? "Task not found." : result.error,
      };
    }
    return { ok: true, data: result.task };
  }

  if (name === "update_task") {
    if (typeof args.taskId !== "string") {
      return { ok: false, error: "update_task requires taskId." };
    }
    // Resolve label names → IDs before validation.
    const labelNames = Array.isArray(args.labelNames)
      ? (args.labelNames as string[])
      : undefined;
    const labelIds =
      labelNames !== undefined
        ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
        : undefined;

    const { taskId, ...rest } = args;
    const parsed = updateTaskSchema.safeParse({
      ...rest,
      ...(labelIds !== undefined ? { labelIds } : {}),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid update_task input.",
      };
    }
    const result = await updateTask(taskId as string, userId, parsed.data);
    if (!result.ok) {
      return {
        ok: false,
        error: result.notFound ? "Task not found." : result.error,
      };
    }
    return { ok: true, data: result.task };
  }

  if (name === "create_label") {
    const parsed = createLabelSchema.safeParse(args);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid create_label input.",
      };
    }
    const result = await createLabel(userId, parsed.data);
    if (!result.ok) {
      return {
        ok: false,
        error: result.duplicate
          ? "A label with that name already exists."
          : "Failed to create label.",
      };
    }
    return { ok: true, data: result.label };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
