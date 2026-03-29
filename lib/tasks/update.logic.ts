/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { TaskRecord } from "./list.logic";

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  status?: string;
  priority?: string;
  dueDate?: Date | null;
  meetingId?: string | null;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskRecord | null> {
  const existing = await db.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) return null;

  const row = await db.task.update({
    where: { id: taskId },
    data: { ...input },
  });

  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    meetingId: row.meetingId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
