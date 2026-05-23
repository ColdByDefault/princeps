/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since beta
 */

import "server-only";

import { db } from "@/lib/core/db";
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
      ...(input.delegatedTo !== undefined && {
        delegatedTo: input.delegatedTo,
      }),
      ...(input.delegatedAt !== undefined && {
        delegatedAt: input.delegatedAt ? new Date(input.delegatedAt) : null,
      }),
      ...(input.delegateNotes !== undefined && {
        delegateNotes: input.delegateNotes,
      }),
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
