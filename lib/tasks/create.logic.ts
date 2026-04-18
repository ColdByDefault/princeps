/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
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
      ...(input.meetingId !== undefined && { meetingId: input.meetingId }),
      ...(input.labelIds?.length
        ? {
            labelLinks: {
              create: input.labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
      ...(input.goalIds?.length
        ? {
            goalLinks: {
              create: input.goalIds.map((goalId) => ({ goalId })),
            },
          }
        : {}),
    },
    select: TASK_SELECT,
  });

  return toTaskRecord(row);
}
