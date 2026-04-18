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
import type { MilestoneRecord } from "@/types/api";
import type { CreateMilestoneInput, UpdateMilestoneInput } from "./schemas";

function toRecord(m: {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}): MilestoneRecord {
  return {
    id: m.id,
    title: m.title,
    completed: m.completed,
    position: m.position,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

const MILESTONE_SELECT = {
  id: true,
  title: true,
  completed: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Adds a milestone to a goal. Verifies ownership via goal.userId.
 */
export async function createMilestone(
  goalId: string,
  userId: string,
  input: CreateMilestoneInput,
): Promise<MilestoneRecord | null> {
  // Verify ownership
  const goal = await db.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });
  if (!goal) return null;

  const row = await db.milestone.create({
    data: {
      goalId,
      title: input.title,
      position: input.position ?? 0,
    },
    select: MILESTONE_SELECT,
  });

  return toRecord(row);
}

/**
 * Updates a milestone. Verifies ownership via the goal relation.
 */
export async function updateMilestone(
  milestoneId: string,
  goalId: string,
  userId: string,
  input: UpdateMilestoneInput,
): Promise<MilestoneRecord | null> {
  // Verify ownership — must belong to a goal owned by userId
  const existing = await db.milestone.findFirst({
    where: { id: milestoneId, goalId, goal: { userId } },
    select: { id: true },
  });
  if (!existing) return null;

  const row = await db.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.completed !== undefined && { completed: input.completed }),
      ...(input.position !== undefined && { position: input.position }),
    },
    select: MILESTONE_SELECT,
  });

  return toRecord(row);
}

/**
 * Deletes a milestone. Verifies ownership via the goal relation.
 */
export async function deleteMilestone(
  milestoneId: string,
  goalId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.milestone.deleteMany({
    where: { id: milestoneId, goalId, goal: { userId } },
  });
  return { ok: count > 0 };
}
