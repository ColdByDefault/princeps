/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { DecisionRecord } from "./list.logic";

export interface CreateDecisionInput {
  title: string;
  rationale?: string | null;
  outcome?: string | null;
  status?: string;
  decidedAt?: Date | null;
  meetingId?: string | null;
}

/**
 * Creates a new decision for the given user and returns the created record.
 */
export async function createDecision(
  userId: string,
  input: CreateDecisionInput,
): Promise<DecisionRecord> {
  const row = await db.decision.create({
    data: {
      userId,
      title: input.title,
      rationale: input.rationale ?? null,
      outcome: input.outcome ?? null,
      status: input.status ?? "open",
      decidedAt: input.decidedAt ?? null,
      meetingId: input.meetingId ?? null,
    },
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
