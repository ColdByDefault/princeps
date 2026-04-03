/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { TASK_SELECT, toTaskRecord } from "./shared.logic";
import type { UpdateTaskInput } from "./schemas";
import type { TaskRecord } from "@/types/api";

export type UpdateTaskResult =
  | { ok: true; task: TaskRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<UpdateTaskResult> {
  const existing = await db.task.findFirst({ where: { id: taskId, userId } });

  if (!existing) {
    return { ok: false, notFound: true };
  }

  const row = await db.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
    },
    select: TASK_SELECT,
  });

  return { ok: true, task: toTaskRecord(row) };
}
