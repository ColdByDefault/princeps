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

export interface UpdateDecisionInput {
  title?: string;
  rationale?: string | null;
  outcome?: string | null;
  status?: string;
  decidedAt?: Date | null;
  meetingId?: string | null;
  labelIds?: string[];
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

  const labelIds =
    input.labelIds !== undefined
      ? await assertOwnedLabelIds(userId, input.labelIds)
      : undefined;

  const { labelIds: _labelIds, ...fields } = input;

  const row = await db.decision.update({
    where: { id: decisionId },
    data: {
      ...fields,
      ...(labelIds !== undefined && {
        labelLinks: {
          deleteMany: {},
          create: labelIds.map((labelId) => ({ labelId })),
        },
      }),
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
