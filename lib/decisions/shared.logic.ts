import "server-only";
import type { DecisionRecord } from "@/types/api";

export const DECISION_SELECT = {
  id: true,
  title: true,
  rationale: true,
  outcome: true,
  status: true,
  decidedAt: true,
  meetingId: true,
  createdAt: true,
  updatedAt: true,
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true, icon: true } },
    },
  },
} as const;

type DecisionRow = {
  id: string;
  title: string;
  rationale: string | null;
  outcome: string | null;
  status: string;
  decidedAt: Date | null;
  meetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: { label: { id: string; name: string; color: string } }[];
};

export function toDecisionRecord(row: DecisionRow): DecisionRecord {
  return {
    id: row.id,
    title: row.title,
    rationale: row.rationale,
    outcome: row.outcome,
    status: row.status,
    decidedAt: row.decidedAt?.toISOString() ?? null,
    meetingId: row.meetingId,
    labels: row.labelLinks.map((l) => l.label),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
