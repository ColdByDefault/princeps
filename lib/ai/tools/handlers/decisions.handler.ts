/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";
import { createDecision } from "@/lib/features/decisions/create.logic";
import { listDecisions } from "@/lib/features/decisions/list.logic";
import { updateDecision } from "@/lib/features/decisions/update.logic";
import { deleteDecision } from "@/lib/features/decisions/delete.logic";
import {
  createDecisionSchema,
  updateDecisionSchema,
} from "@/lib/features/decisions/schemas";
import {
  resolveMeetingIdByRef,
  resolveOrCreateLabelIdsByNames,
} from "@/lib/ai/tools/resolvers";
import { enforceDecisionsMax } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

async function handleCreateDecision(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const labelNames = Array.isArray(args.labelNames) ? args.labelNames : [];
  const labelIds = labelNames.length
    ? await resolveOrCreateLabelIdsByNames(userId, labelNames as string[])
    : undefined;

  const parsed = createDecisionSchema.safeParse({ ...args, labelIds });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Invalid create_decision input.",
    };
  }

  const input = { ...parsed.data };
  if (input.meetingId) {
    const meetingId = await resolveMeetingIdByRef(userId, input.meetingId);
    if (!meetingId) {
      return {
        ok: false,
        error: `Meeting not found for create_decision: ${input.meetingId}. Use list_meetings or the create_meeting result before linking a decision.`,
      };
    }
    input.meetingId = meetingId;
  }

  // Tier gate
  const gate = await enforceDecisionsMax(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Decision limit reached for your plan.",
    };
  }

  const existingDecisions = await listDecisions(userId);
  const normalizedNew = normalizeText(input.title);
  const duplicate = existingDecisions
    .filter((decision) => decision.status !== "reversed")
    .find((decision) => {
      const normalizedExisting = normalizeText(decision.title);
      return (
        normalizedExisting === normalizedNew ||
        normalizedExisting.includes(normalizedNew) ||
        normalizedNew.includes(normalizedExisting)
      );
    });

  if (duplicate) {
    return {
      ok: false,
      error: `A similar decision already exists: "${duplicate.title}" (${duplicate.status}, id: ${duplicate.id}). Avoid creating duplicates — update the existing decision if it needs more detail.`,
    };
  }

  const decision = await createDecision(userId, input);
  return { ok: true, data: decision };
}

async function handleListDecisions(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const validStatuses = ["open", "decided", "reversed"] as const;
  type DecisionStatus = (typeof validStatuses)[number];
  const status =
    typeof args.status === "string" &&
    validStatuses.includes(args.status as DecisionStatus)
      ? (args.status as DecisionStatus)
      : undefined;

  const decisions = await listDecisions(userId, status ? { status } : {});
  return { ok: true, data: decisions };
}

async function handleUpdateDecision(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.decisionId !== "string") {
    return { ok: false, error: "update_decision requires decisionId." };
  }

  const labelNames = Array.isArray(args.labelNames)
    ? args.labelNames
    : undefined;
  const labelIds =
    labelNames !== undefined
      ? await resolveOrCreateLabelIdsByNames(userId, labelNames as string[])
      : undefined;

  const { decisionId, ...rest } = args;
  const parsed = updateDecisionSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Invalid update_decision input.",
    };
  }

  const input = { ...parsed.data };
  if (input.meetingId) {
    const meetingId = await resolveMeetingIdByRef(userId, input.meetingId);
    if (!meetingId) {
      return {
        ok: false,
        error: `Meeting not found for update_decision: ${input.meetingId}. Use list_meetings or the create_meeting result before linking a decision.`,
      };
    }
    input.meetingId = meetingId;
  }

  const result = await updateDecision(
    decisionId as string,
    userId,
    input,
  );
  if (!result.ok) {
    return {
      ok: false,
      error: result.notFound ? "Decision not found." : result.error,
    };
  }
  return { ok: true, data: result.decision };
}

async function handleDeleteDecision(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.decisionId !== "string") {
    return { ok: false, error: "delete_decision requires decisionId." };
  }

  const result = await deleteDecision(args.decisionId, userId);
  if (!result.ok) {
    return { ok: false, error: "Decision not found." };
  }
  return { ok: true, data: { deleted: true } };
}

export const decisionHandlers: Record<string, ToolHandler> = {
  create_decision: handleCreateDecision,
  list_decisions: handleListDecisions,
  update_decision: handleUpdateDecision,
  delete_decision: handleDeleteDecision,
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
