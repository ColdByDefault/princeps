import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionRecord } from "@/types/api";
import type { LabelLinkRow } from "@/tests/helpers/db-rows";

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
  labelLinks: LabelLinkRow[];
};

type DecisionCreateArgs = {
  data: {
    userId: string;
    title: string;
    rationale: string | null;
    outcome: string | null;
    status: string;
    decidedAt: Date | null;
    meetingId?: string | null;
    labelLinks?: { create: { labelId: string }[] };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  decisionCreate: vi.fn<
    (args: DecisionCreateArgs) => Promise<DbDecisionRow>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    decision: {
      create: mocks.decisionCreate,
    },
  },
}));

import { createDecision } from "@/lib/features/decisions/create.logic";

describe("createDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists user-scoped decision data and returns a client-safe record", async () => {
    const decidedAt = new Date("2026-06-01T08:00:00.000Z");
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    const row: DbDecisionRow = {
      id: "decision-1",
      title: "Adopt new reporting cadence",
      rationale: "The team needs a tighter executive loop.",
      outcome: "Move to weekly reporting.",
      status: "decided",
      decidedAt,
      meetingId: "meeting-1",
      meeting: { title: "Ops review" },
      createdAt,
      updatedAt,
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
    mocks.decisionCreate.mockResolvedValue(row);

    const record = await createDecision("user-1", {
      title: "Adopt new reporting cadence",
      rationale: "The team needs a tighter executive loop.",
      outcome: "Move to weekly reporting.",
      status: "decided",
      decidedAt: "2026-06-01T08:00:00Z",
      meetingId: "meeting-1",
      labelIds: ["label-1", "label-1"],
    });

    const createArgs = mocks.decisionCreate.mock.calls[0]?.[0];
    expect(createArgs?.data).toMatchObject({
      userId: "user-1",
      title: "Adopt new reporting cadence",
      rationale: "The team needs a tighter executive loop.",
      outcome: "Move to weekly reporting.",
      status: "decided",
      meetingId: "meeting-1",
      labelLinks: { create: [{ labelId: "label-1" }] },
    });
    expect(createArgs?.data.decidedAt).toBeInstanceOf(Date);
    expect(createArgs?.data.decidedAt?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedRecord: DecisionRecord = {
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
    };
    expect(record).toEqual(expectedRecord);
  });

  it("defaults missing optional fields for a new open decision", async () => {
    mocks.decisionCreate.mockResolvedValue({
      id: "decision-1",
      title: "Adopt new reporting cadence",
      rationale: null,
      outcome: null,
      status: "open",
      decidedAt: null,
      meetingId: null,
      meeting: null,
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
      labelLinks: [],
    });

    await createDecision("user-1", {
      title: "Adopt new reporting cadence",
    });

    expect(mocks.decisionCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        title: "Adopt new reporting cadence",
        rationale: null,
        outcome: null,
        status: "open",
        decidedAt: null,
      },
      select: expect.objectContaining({ id: true, title: true }),
    });
  });
});
