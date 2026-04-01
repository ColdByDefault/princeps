/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelOptionRecord } from "@/types/api";
import {
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";

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
    include: {
      labelLinks: {
        include: { label: { select: labelOptionSelect } },
      },
    },
  });

  return rows
    .slice()
    .sort(
      (a, b) =>
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority),
    )
    .map((r) => ({
      id: r.id,
      title: r.title,
      notes: r.notes,
      status: r.status,
      priority: r.priority,
      dueDate: r.dueDate,
      meetingId: r.meetingId,
      labels: r.labelLinks.map((link) => toLabelOptionRecord(link.label)),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
}
