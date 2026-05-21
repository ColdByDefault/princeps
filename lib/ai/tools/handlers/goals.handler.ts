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
import { createGoal } from "@/lib/features/goals/create.logic";
import { listGoals } from "@/lib/features/goals/list.logic";
import { updateGoal } from "@/lib/features/goals/update.logic";
import { deleteGoal } from "@/lib/features/goals/delete.logic";
import { createMilestone, updateMilestone } from "@/lib/features/goals/milestones.logic";
import { createGoalSchema, updateGoalSchema } from "@/lib/features/goals/schemas";
import {
  resolveOrCreateLabelIdsByNames,
  resolveTaskIdsByRefs,
  resolveMeetingIdByRef,
} from "@/lib/ai/tools/resolvers";
import { enforceGoalsMax } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

async function handleCreateGoal(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  // Resolve label names → ids
  const labelNames = Array.isArray(args.labelNames) ? args.labelNames : [];
  const labelIds = labelNames.length
    ? await resolveOrCreateLabelIdsByNames(userId, labelNames as string[])
    : undefined;
  const taskRefs = Array.isArray(args.taskIds)
    ? (args.taskIds as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : undefined;
  const taskIds =
    taskRefs !== undefined
      ? await resolveTaskIdsByRefs(userId, taskRefs)
      : undefined;
  if (taskIds?.missing.length) {
    return {
      ok: false,
      error: `Task not found for create_goal: ${taskIds.missing.join(", ")}. Use list_tasks or the create_task result before linking a goal.`,
    };
  }

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

  // Resolve meetingId ref (name or ID) to a real ID
  let meetingId: string | null | undefined = undefined;
  if (typeof args.meetingId === "string" && args.meetingId.trim()) {
    const resolved = await resolveMeetingIdByRef(userId, args.meetingId);
    if (!resolved) {
      return {
        ok: false,
        error: `Meeting not found for create_goal: ${args.meetingId}. Use list_meetings or the create_meeting result before linking a goal.`,
      };
    }
    meetingId = resolved;
  }

  const { labelNames: _ln, milestones: _ms, ...rest } = args;
  const parsed = createGoalSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
    ...(taskIds !== undefined ? { taskIds: taskIds.ids } : {}),
    ...(milestones !== undefined ? { milestones } : {}),
    ...(meetingId !== undefined ? { meetingId } : {}),
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
  const taskRefs = Array.isArray(args.taskIds)
    ? (args.taskIds as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : undefined;
  const taskIds =
    taskRefs !== undefined
      ? await resolveTaskIdsByRefs(userId, taskRefs)
      : undefined;
  if (taskIds?.missing.length) {
    return {
      ok: false,
      error: `Task not found for update_goal: ${taskIds.missing.join(", ")}. Use list_tasks or the create_task result before linking a goal.`,
    };
  }

  const { goalId, labelNames: _ln, ...rest } = args;

  // Resolve meetingId ref (name or ID) to a real ID
  let meetingId: string | null | undefined = undefined;
  if (typeof args.meetingId === "string" && args.meetingId.trim()) {
    const resolved = await resolveMeetingIdByRef(userId, args.meetingId);
    if (!resolved) {
      return {
        ok: false,
        error: `Meeting not found for update_goal: ${args.meetingId}. Use list_meetings or the create_meeting result before linking a goal.`,
      };
    }
    meetingId = resolved;
  }

  const parsed = updateGoalSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
    ...(taskIds !== undefined ? { taskIds: taskIds.ids } : {}),
    ...(meetingId !== undefined ? { meetingId } : {}),
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
