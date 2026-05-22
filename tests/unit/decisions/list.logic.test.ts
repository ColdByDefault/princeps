import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionRecord } from "@/types/api";

type DbDecisionRow = {
  id: string;
  title: string;
  rationale: string | null;
  outcome: string | null;
  status: string;
  decidedAt: Date | null;
  meetingId: string | null;
  meeting: { title: string } | null;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: {
    label: { id: string; name: string; color: string; icon: string | null };
  }[];
};

type DecisionFindManyArgs = {
  where: {
    userId: string;
    status?: "open" | "decided" | "reversed";
  };
  orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }];
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  decisionFindMany: vi.fn<
    (args: DecisionFindManyArgs) => Promise<DbDecisionRow[]>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    decision: {
      findMany: mocks.decisionFindMany,
    },
  },
}));

import { listDecisions } from "@/lib/features/decisions/list.logic";

describe("listDecisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists decisions scoped to the user and maps rows to client-safe records", async () => {
    const row: DbDecisionRow = {
      id: "decision-1",
      title: "Adopt new reporting cadence",
      rationale: "The team needs a tighter executive loop.",
      outcome: "Move to weekly reporting.",
      status: "decided",
      decidedAt: new Date("2026-06-01T08:00:00.000Z"),
      meetingId: "meeting-1",
      meeting: { title: "Ops review" },
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
      labelLinks: [
        {
          label: {
            id: "label-1",
            name: "Ops",
            color: "#2563eb",
            icon: null,
          },
        },
      ],
    };
    mocks.decisionFindMany.mockResolvedValue([row]);

    const records = await listDecisions("user-1");

    expect(mocks.decisionFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecords: DecisionRecord[] = [
      {
        id: "decision-1",
        title: "Adopt new reporting cadence",
        rationale: "The team needs a tighter executive loop.",
        outcome: "Move to weekly reporting.",
        status: "decided",
        decidedAt: "2026-06-01T08:00:00.000Z",
        meetingId: "meeting-1",
        meetingTitle: "Ops review",
        labels: [{ id: "label-1", name: "Ops", color: "#2563eb", icon: null }],
        createdAt: "2026-05-08T06:00:00.000Z",
        updatedAt: "2026-05-08T06:30:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });

  it("applies the optional status filter", async () => {
    mocks.decisionFindMany.mockResolvedValue([]);

    await listDecisions("user-1", { status: "open" });

    const findManyArgs = mocks.decisionFindMany.mock.calls[0]?.[0];
    expect(findManyArgs?.where).toEqual({
      userId: "user-1",
      status: "open",
    });
  });
});
