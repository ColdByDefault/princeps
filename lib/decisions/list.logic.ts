/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelOptionRecord } from "@/types/api";
import {
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";

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
    include: {
      labelLinks: {
        include: { label: { select: labelOptionSelect } },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    rationale: r.rationale,
    outcome: r.outcome,
    status: r.status,
    decidedAt: r.decidedAt,
    meetingId: r.meetingId,
    labels: r.labelLinks.map((link) => toLabelOptionRecord(link.label)),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
