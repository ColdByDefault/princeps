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
import { GOAL_SELECT, toGoalRecord } from "./shared.logic";
import type { CreateGoalInput } from "./schemas";
import type { GoalRecord } from "@/types/api";

export async function createGoal(
  userId: string,
  input: CreateGoalInput,
): Promise<GoalRecord> {
  const row = await db.goal.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "open",
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      ...(input.labelIds?.length
        ? {
            labelLinks: {
              create: input.labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
      ...(input.taskIds?.length
        ? {
            taskLinks: {
              create: input.taskIds.map((taskId) => ({ taskId })),
            },
          }
        : {}),
      ...(input.milestones?.length
        ? {
            milestones: {
              create: input.milestones.map((m, idx) => ({
                title: m.title,
                completed: m.completed ?? false,
                position: m.position ?? idx,
              })),
            },
          }
        : {}),
    },
    select: GOAL_SELECT,
  });

  return toGoalRecord(row);
}
