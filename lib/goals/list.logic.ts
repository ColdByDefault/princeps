/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";
import { db } from "@/lib/db";
import { GOAL_SELECT, toGoalRecord } from "./shared.logic";
import type { GoalRecord } from "@/types/api";

type ListGoalsFilter = {
  status?: "open" | "in_progress" | "done" | "cancelled";
};

export async function listGoals(
  userId: string,
  filter: ListGoalsFilter = {},
): Promise<GoalRecord[]> {
  const rows = await db.goal.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }],
    select: GOAL_SELECT,
  });

  return rows.map(toGoalRecord);
}
