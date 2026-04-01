/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelOptionRecord } from "@/types/api";
import { taskInclude, toTaskRecord } from "./shared.logic";

export interface TaskRecord {
  id: string;
  title: string;
  notes: string | null;
  status: string; // open | in_progress | done | cancelled
  priority: string; // low | normal | high | urgent
  dueDate: Date | null;
  meetingId: string | null;
  labels: LabelOptionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns all tasks for the given user, ordered by priority then dueDate.
 */
export async function listTasks(userId: string): Promise<TaskRecord[]> {
  const priorityOrder = ["urgent", "high", "normal", "low"];

  const rows = await db.task.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: taskInclude,
  });

  return rows
    .slice()
    .sort(
      (a, b) =>
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
    )
    .map(toTaskRecord);
}
