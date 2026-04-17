/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";
import { createDecision } from "@/lib/decisions/create.logic";
import { listDecisions } from "@/lib/decisions/list.logic";
import { updateDecision } from "@/lib/decisions/update.logic";
import { deleteDecision } from "@/lib/decisions/delete.logic";
import {
  createDecisionSchema,
  updateDecisionSchema,
} from "@/lib/decisions/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/tools/resolvers";
import { enforceDecisionsMax } from "@/lib/tiers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

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

  // Tier gate
  const gate = await enforceDecisionsMax(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Decision limit reached for your plan.",
    };
  }

  const decision = await createDecision(userId, parsed.data);
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

  const result = await updateDecision(
    decisionId as string,
    userId,
    parsed.data,
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
