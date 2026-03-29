/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { TaskRecord } from "./list.logic";

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  status?: string;
  priority?: string;
  dueDate?: Date | null;
  meetingId?: string | null;
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskRecord> {
  const row = await db.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      status: input.status ?? "open",
      priority: input.priority ?? "normal",
      dueDate: input.dueDate ?? null,
      meetingId: input.meetingId ?? null,
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
