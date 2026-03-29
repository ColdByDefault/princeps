/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export interface DecisionRecord {
  id: string;
  title: string;
  rationale: string | null;
  outcome: string | null;
  status: string; // open | decided | reversed
  decidedAt: Date | null;
  meetingId: string | null;
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
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    rationale: r.rationale,
    outcome: r.outcome,
    status: r.status,
    decidedAt: r.decidedAt,
    meetingId: r.meetingId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
