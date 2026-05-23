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
import type { TaskRecord } from "@/types/api";

type ListTasksFilter = {
  status?: "open" | "in_progress" | "done" | "cancelled";
  delegated?: boolean;
};

export async function listTasks(
  userId: string,
  filter: ListTasksFilter = {},
): Promise<TaskRecord[]> {
  const rows = await db.task.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.delegated === true ? { delegatedTo: { not: null } } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: TASK_SELECT,
  });

  return rows.map(toTaskRecord);
}
