/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { assertOwnedLabelIds } from "@/lib/labels/shared.logic";
import type { DecisionRecord } from "./list.logic";
import { decisionInclude, toDecisionRecord } from "./shared.logic";

export interface CreateDecisionInput {
  title: string;
  rationale?: string | null;
  outcome?: string | null;
  status?: string;
  decidedAt?: Date | null;
  meetingId?: string | null;
  labelIds?: string[];
}

/**
 * Creates a new decision for the given user and returns the created record.
 */
export async function createDecision(
  userId: string,
  input: CreateDecisionInput,
): Promise<DecisionRecord> {
  const labelIds = await assertOwnedLabelIds(userId, input.labelIds);

  const row = await db.decision.create({
    data: {
      userId,
      title: input.title,
      rationale: input.rationale ?? null,
      outcome: input.outcome ?? null,
      status: input.status ?? "open",
      decidedAt: input.decidedAt ?? null,
      meetingId: input.meetingId ?? null,
      ...(labelIds.length > 0
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    include: decisionInclude,
  });

  return toDecisionRecord(row);
}
