import "server-only";
import { db } from "@/lib/db";
import { DECISION_SELECT, toDecisionRecord } from "./shared.logic";
import type { CreateDecisionInput } from "./schemas";
import type { DecisionRecord } from "@/types/api";

export async function createDecision(
  userId: string,
  input: CreateDecisionInput,
): Promise<DecisionRecord> {
  const labelIds = uniqueIds(input.labelIds);

  const row = await db.decision.create({
    data: {
      userId,
      title: input.title,
      rationale: input.rationale ?? null,
      outcome: input.outcome ?? null,
      status: input.status ?? "open",
      decidedAt: input.decidedAt ? new Date(input.decidedAt) : null,
      ...(input.meetingId !== undefined && { meetingId: input.meetingId }),
      ...(labelIds.length
        ? {
            labelLinks: {
              create: labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    select: DECISION_SELECT,
  });

  return toDecisionRecord(row);
}

function uniqueIds(ids: string[] | undefined): string[] {
  return ids ? [...new Set(ids)] : [];
}
