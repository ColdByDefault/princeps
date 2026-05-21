import "server-only";
import { db } from "@/lib/db";
import { DECISION_SELECT, toDecisionRecord } from "./shared.logic";
import type { UpdateDecisionInput } from "./schemas";
import type { DecisionRecord } from "@/types/api";

export type UpdateDecisionResult =
  | { ok: true; decision: DecisionRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function updateDecision(
  decisionId: string,
  userId: string,
  input: UpdateDecisionInput,
): Promise<UpdateDecisionResult> {
  const labelIds =
    input.labelIds !== undefined ? uniqueIds(input.labelIds) : undefined;

  const row = await db.decision
    .update({
      where: { id: decisionId, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.rationale !== undefined && { rationale: input.rationale }),
        ...(input.outcome !== undefined && { outcome: input.outcome }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.decidedAt !== undefined && {
          decidedAt: input.decidedAt ? new Date(input.decidedAt) : null,
        }),
        ...(input.meetingId !== undefined && { meetingId: input.meetingId }),
        ...(labelIds !== undefined && {
          labelLinks: {
            deleteMany: {},
            create: labelIds.map((labelId) => ({ labelId })),
          },
        }),
      },
      select: DECISION_SELECT,
    })
    .catch(() => null);

  if (!row) return { ok: false, notFound: true };
  return { ok: true, decision: toDecisionRecord(row) };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
