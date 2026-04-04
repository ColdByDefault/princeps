/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createTask } from "@/lib/tasks/create.logic";
import { listTasks } from "@/lib/tasks/list.logic";
import { updateTask } from "@/lib/tasks/update.logic";
import { createTaskSchema, updateTaskSchema } from "@/lib/tasks/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/tools/resolvers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleCreateTask(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
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

  // Duplicate detection: check active tasks for an exact or near-match title.
  const activeTasks = await listTasks(userId);
  const normalizedNew = parsed.data.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const duplicate = activeTasks
    .filter((t) => t.status === "open" || t.status === "in_progress")
    .find((t) => {
      const norm = t.title.trim().toLowerCase().replace(/\s+/g, " ");
      return (
        norm === normalizedNew ||
        norm.includes(normalizedNew) ||
        normalizedNew.includes(norm)
      );
    });

  if (duplicate) {
    return {
      ok: false,
      error: `A similar active task already exists: "${duplicate.title}" (${duplicate.status}). Avoid creating duplicates — suggest updating the existing task instead, or confirm with the user that a separate task is intended.`,
    };
  }

  const task = await createTask(userId, parsed.data);
  return { ok: true, data: task };
}

async function handleListTasks(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
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

async function handleCompleteTask(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
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

async function handleUpdateTask(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.taskId !== "string") {
    return { ok: false, error: "update_task requires taskId." };
  }
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

export const taskHandlers: Record<string, ToolHandler> = {
  create_task: handleCreateTask,
  list_tasks: handleListTasks,
  complete_task: handleCompleteTask,
  update_task: handleUpdateTask,
};
