/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { assertOwnedLabelIds } from "@/lib/labels/shared.logic";
import type { TaskRecord } from "./list.logic";
import { taskInclude, toTaskRecord } from "./shared.logic";

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  status?: string;
  priority?: string;
  dueDate?: Date | null;
  meetingId?: string | null;
  labelIds?: string[];
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskRecord | null> {
  const existing = await db.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) return null;

  const labelIds =
    input.labelIds !== undefined
      ? await assertOwnedLabelIds(userId, input.labelIds)
      : undefined;

  const { labelIds: _labelIds, ...fields } = input;

  const row = await db.task.update({
    where: { id: taskId },
    data: {
      ...fields,
      ...(labelIds !== undefined && {
        labelLinks: {
          deleteMany: {},
          create: labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
    include: taskInclude,
  });

  return toTaskRecord(row);
}
