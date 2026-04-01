/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { assertOwnedLabelIds } from "@/lib/labels/shared.logic";
import type { TaskRecord } from "./list.logic";
import { taskInclude, toTaskRecord } from "./shared.logic";

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  status?: string;
  priority?: string;
  dueDate?: Date | null;
  meetingId?: string | null;
  labelIds?: string[];
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskRecord> {
  const labelIds = await assertOwnedLabelIds(userId, input.labelIds);

  const row = await db.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      status: input.status ?? "open",
      priority: input.priority ?? "normal",
      dueDate: input.dueDate ?? null,
      meetingId: input.meetingId ?? null,
      ...(labelIds.length > 0
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    include: taskInclude,
  });

  return toTaskRecord(row);
}
