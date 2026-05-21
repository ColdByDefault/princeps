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
import { db } from "@/lib/core/db";
import { GOAL_SELECT, toGoalRecord } from "./shared.logic";
import type { CreateGoalInput } from "./schemas";
import type { GoalRecord } from "@/types/api";

export async function createGoal(
  userId: string,
  input: CreateGoalInput,
): Promise<GoalRecord> {
  const labelIds = uniqueIds(input.labelIds);
  const taskIds = uniqueIds(input.taskIds);

  const row = await db.goal.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "open",
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      meetingId: input.meetingId ?? null,
      ...(labelIds.length
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
      ...(taskIds.length
        ? {
            taskLinks: {
              create: taskIds.map((taskId) => ({ taskId })),
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

function uniqueIds(ids: string[] | undefined): string[] {
  return ids ? [...new Set(ids)] : [];
}
