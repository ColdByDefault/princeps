/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import {
  assertOwnedLabelIds,
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";
import type { TaskRecord } from "./list.logic";

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
    include: {
      labelLinks: {
        include: { label: { select: labelOptionSelect } },
      },
    },
  });

  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    meetingId: row.meetingId,
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
