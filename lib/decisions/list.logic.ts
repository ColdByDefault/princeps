import "server-only";
import { db } from "@/lib/db";
import { DECISION_SELECT, toDecisionRecord } from "./shared.logic";
import type { DecisionRecord } from "@/types/api";

type ListDecisionsFilter = {
  status?: "open" | "decided" | "reversed";
};

export async function listDecisions(
  userId: string,
  filter: ListDecisionsFilter = {},
): Promise<DecisionRecord[]> {
  const rows = await db.decision.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
    select: DECISION_SELECT,
  });

  return rows.map(toDecisionRecord);
}
