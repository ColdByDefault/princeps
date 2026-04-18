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
import { createGoal } from "@/lib/goals/create.logic";
import { listGoals } from "@/lib/goals/list.logic";
import { updateGoal } from "@/lib/goals/update.logic";
import { deleteGoal } from "@/lib/goals/delete.logic";
import { createMilestone, updateMilestone } from "@/lib/goals/milestones.logic";
import { createGoalSchema, updateGoalSchema } from "@/lib/goals/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/tools/resolvers";
import { enforceGoalsMax } from "@/lib/tiers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleCreateGoal(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  // Resolve label names → ids
  const labelNames = Array.isArray(args.labelNames) ? args.labelNames : [];
  const labelIds = labelNames.length
    ? await resolveOrCreateLabelIdsByNames(userId, labelNames as string[])
    : undefined;

  // Convert milestone title strings to milestone input objects
  const milestoneStrings = Array.isArray(args.milestones)
    ? args.milestones
    : [];
  const milestones = (milestoneStrings as unknown[]).every(
    (m) => typeof m === "string",
  )
    ? (milestoneStrings as string[]).map((title, idx) => ({
        title,
        position: idx,
      }))
    : undefined;

  const { labelNames: _ln, milestones: _ms, ...rest } = args;
  const parsed = createGoalSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
    ...(milestones !== undefined ? { milestones } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid create_goal input.",
    };
  }

  const gate = await enforceGoalsMax(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Goal limit reached for your plan.",
    };
  }

  const goal = await createGoal(userId, parsed.data);
  return { ok: true, data: goal };
}

async function handleListGoals(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const validStatuses = ["open", "in_progress", "done", "cancelled"] as const;
  type GoalStatus = (typeof validStatuses)[number];
  const status =
    typeof args.status === "string" &&
    validStatuses.includes(args.status as GoalStatus)
      ? (args.status as GoalStatus)
      : undefined;

  const goals = await listGoals(userId, status ? { status } : {});
  return { ok: true, data: goals };
}

async function handleUpdateGoal(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.goalId !== "string") {
    return { ok: false, error: "update_goal requires goalId." };
  }

  const labelNames = Array.isArray(args.labelNames)
    ? args.labelNames
    : undefined;
  const labelIds =
    labelNames !== undefined
      ? await resolveOrCreateLabelIdsByNames(userId, labelNames as string[])
      : undefined;

  const { goalId, labelNames: _ln, ...rest } = args;
  const parsed = updateGoalSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid update_goal input.",
    };
  }

  const result = await updateGoal(goalId as string, userId, parsed.data);
  if (!result.ok) {
    return { ok: false, error: "Goal not found." };
  }
  return { ok: true, data: result.goal };
}

async function handleDeleteGoal(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.goalId !== "string") {
    return { ok: false, error: "delete_goal requires goalId." };
  }

  const result = await deleteGoal(args.goalId, userId);
  if (!result.ok) return { ok: false, error: "Goal not found." };
  return { ok: true, data: { deleted: true } };
}

async function handleAddGoalMilestone(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.goalId !== "string") {
    return { ok: false, error: "add_goal_milestone requires goalId." };
  }
  if (typeof args.title !== "string" || !args.title.trim()) {
    return { ok: false, error: "add_goal_milestone requires title." };
  }

  const milestone = await createMilestone(args.goalId, userId, {
    title: args.title,
  });
  if (!milestone) return { ok: false, error: "Goal not found." };
  return { ok: true, data: milestone };
}

async function handleCompleteGoalMilestone(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.goalId !== "string") {
    return { ok: false, error: "complete_goal_milestone requires goalId." };
  }
  if (typeof args.milestoneId !== "string") {
    return {
      ok: false,
      error: "complete_goal_milestone requires milestoneId.",
    };
  }

  const completed = args.completed !== false; // default to true
  const milestone = await updateMilestone(
    args.milestoneId,
    args.goalId,
    userId,
    { completed },
  );
  if (!milestone) return { ok: false, error: "Milestone not found." };
  return { ok: true, data: milestone };
}

export const goalHandlers: Record<string, ToolHandler> = {
  create_goal: handleCreateGoal,
  list_goals: handleListGoals,
  update_goal: handleUpdateGoal,
  delete_goal: handleDeleteGoal,
  add_goal_milestone: handleAddGoalMilestone,
  complete_goal_milestone: handleCompleteGoalMilestone,
};
