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
import type { UpdateGoalInput } from "./schemas";
import type { GoalRecord } from "@/types/api";

export type UpdateGoalResult =
  | { ok: true; goal: GoalRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function updateGoal(
  goalId: string,
  userId: string,
  input: UpdateGoalInput,
): Promise<UpdateGoalResult> {
  const row = await db.goal
    .update({
      where: { id: goalId, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.targetDate !== undefined && {
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
        }),
        ...(input.labelIds !== undefined && {
          labelLinks: {
            deleteMany: {},
            create: input.labelIds.map((labelId) => ({ labelId })),
          },
        }),
        ...(input.taskIds !== undefined && {
          taskLinks: {
            deleteMany: {},
            create: input.taskIds.map((taskId) => ({ taskId })),
          },
        }),
        ...(input.milestones !== undefined && {
          milestones: {
            deleteMany: {},
            create: input.milestones.map((m, idx) => ({
              title: m.title,
              completed: m.completed ?? false,
              position: m.position ?? idx,
            })),
          },
        }),
      },
      select: GOAL_SELECT,
    })
    .catch(() => null);

  if (!row) return { ok: false, notFound: true };
  return { ok: true, goal: toGoalRecord(row) };
}
