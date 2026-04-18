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
import type { TaskRecord } from "@/types/api";

type ListTasksFilter = {
  status?: "open" | "in_progress" | "done" | "cancelled";
};

export async function listTasks(
  userId: string,
  filter: ListTasksFilter = {},
): Promise<TaskRecord[]> {
  const rows = await db.task.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: TASK_SELECT,
  });

  return rows.map(toTaskRecord);
}
