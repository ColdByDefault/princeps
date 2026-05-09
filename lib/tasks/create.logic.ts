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
  const labelIds = uniqueIds(input.labelIds);
  const goalIds = uniqueIds(input.goalIds);

  const row = await db.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      priority: input.priority ?? "normal",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      ...(input.meetingId !== undefined && { meetingId: input.meetingId }),
      ...(labelIds.length
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
      ...(goalIds.length
        ? {
            goalLinks: {
              create: goalIds.map((goalId) => ({ goalId })),
            },
          }
        : {}),
    },
    select: TASK_SELECT,
  });

  return toTaskRecord(row);
}

function uniqueIds(ids: string[] | undefined): string[] {
  return ids ? [...new Set(ids)] : [];
}
