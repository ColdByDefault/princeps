/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { TASK_SELECT, toTaskRecord } from "./shared.logic";
import type { CreateTaskInput } from "./schemas";
import type { TaskRecord } from "@/types/api";

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskRecord> {
  const row = await db.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      priority: input.priority ?? "normal",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      ...(input.labelIds?.length
        ? {
            labelLinks: {
              create: input.labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    select: TASK_SELECT,
  });

  return toTaskRecord(row);
}
