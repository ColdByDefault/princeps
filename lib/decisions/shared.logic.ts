/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import {
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";
import type { DecisionRecord } from "./list.logic";

export const decisionInclude = {
  labelLinks: {
    include: { label: { select: labelOptionSelect } },
  },
} satisfies Prisma.DecisionInclude;

export type DecisionWithRelations = Prisma.DecisionGetPayload<{
  include: typeof decisionInclude;
}>;

export function toDecisionRecord(row: DecisionWithRelations): DecisionRecord {
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
