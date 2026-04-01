/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelOptionRecord } from "@/types/api";
import { decisionInclude, toDecisionRecord } from "./shared.logic";

export interface DecisionRecord {
  id: string;
  title: string;
  rationale: string | null;
  outcome: string | null;
  status: string; // open | decided | reversed
  decidedAt: Date | null;
  meetingId: string | null;
  labels: LabelOptionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns all decisions for the given user, ordered by createdAt descending.
 */
export async function listDecisions(userId: string): Promise<DecisionRecord[]> {
  const rows = await db.decision.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: decisionInclude,
  });

  return rows.map(toDecisionRecord);
}
