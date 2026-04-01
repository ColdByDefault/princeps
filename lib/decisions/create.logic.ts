/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import {
  assertOwnedLabelIds,
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";
import type { DecisionRecord } from "./list.logic";

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
    include: {
      labelLinks: {
        include: { label: { select: labelOptionSelect } },
      },
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
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
