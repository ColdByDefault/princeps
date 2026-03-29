/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { DecisionRecord } from "./list.logic";

export interface UpdateDecisionInput {
  title?: string;
  rationale?: string | null;
  outcome?: string | null;
  status?: string;
  decidedAt?: Date | null;
  meetingId?: string | null;
}

export async function updateDecision(
  userId: string,
  decisionId: string,
  input: UpdateDecisionInput,
): Promise<DecisionRecord | null> {
  const existing = await db.decision.findFirst({
    where: { id: decisionId, userId },
  });
  if (!existing) return null;

  const row = await db.decision.update({
    where: { id: decisionId },
    data: { ...input },
  });

  return {
    id: row.id,
    title: row.title,
    rationale: row.rationale,
    outcome: row.outcome,
    status: row.status,
    decidedAt: row.decidedAt,
    meetingId: row.meetingId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
