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

type DecisionUpdateArgs = {
  where: { id: string; userId: string };
  data: {
    title?: string;
    rationale?: string | null;
    outcome?: string | null;
    status?: string;
    decidedAt?: Date | null;
    meetingId?: string | null;
    labelLinks?: {
      deleteMany: Record<string, never>;
      create: { labelId: string }[];
    };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  decisionUpdate: vi.fn<
    (args: DecisionUpdateArgs) => Promise<DbDecisionRow>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    decision: {
      update: mocks.decisionUpdate,
    },
  },
}));

import { updateDecision } from "@/lib/features/decisions/update.logic";

const createdAt = new Date("2026-05-08T06:00:00.000Z");
const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeDecisionRow(overrides: Partial<DbDecisionRow> = {}): DbDecisionRow {
  return {
    id: "decision-1",
    title: "Adopt new reporting cadence",
    rationale: null,
    outcome: "Move to weekly reporting.",
    status: "decided",
    decidedAt: new Date("2026-06-01T08:00:00.000Z"),
    meetingId: null,
    meeting: null,
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
    ...overrides,
  };
}

describe("updateDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a user-scoped decision, dedupes labels, and maps the result", async () => {
    mocks.decisionUpdate.mockResolvedValue(makeDecisionRow());

    const result = await updateDecision("decision-1", "user-1", {
      title: "Adopt new reporting cadence",
      rationale: null,
      outcome: "Move to weekly reporting.",
      status: "decided",
      decidedAt: "2026-06-01T08:00:00Z",
      meetingId: null,
      labelIds: ["label-1", "label-1"],
    });

    const updateArgs = mocks.decisionUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: "decision-1", userId: "user-1" });
    expect(updateArgs?.data).toMatchObject({
      title: "Adopt new reporting cadence",
      rationale: null,
      outcome: "Move to weekly reporting.",
      status: "decided",
      meetingId: null,
      labelLinks: {
        deleteMany: {},
        create: [{ labelId: "label-1" }],
      },
    });
    expect(updateArgs?.data.decidedAt).toBeInstanceOf(Date);
    expect(updateArgs?.data.decidedAt?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedDecision: DecisionRecord = {
      id: "decision-1",
      title: "Adopt new reporting cadence",
      rationale: null,
      outcome: "Move to weekly reporting.",
      status: "decided",
      decidedAt: "2026-06-01T08:00:00.000Z",
      meetingId: null,
      meetingTitle: null,
      labels: [{ id: "label-1", name: "Ops", color: "#2563eb", icon: null }],
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(result).toEqual({ ok: true, decision: expectedDecision });
  });

  it("clears decidedAt, meeting, and labels when explicit nulls and empty arrays are provided", async () => {
    mocks.decisionUpdate.mockResolvedValue(
      makeDecisionRow({
        decidedAt: null,
        meetingId: null,
        labelLinks: [],
      }),
    );

    const result = await updateDecision("decision-1", "user-1", {
      decidedAt: null,
      meetingId: null,
      labelIds: [],
    });

    const updateArgs = mocks.decisionUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data).toMatchObject({
      decidedAt: null,
      meetingId: null,
      labelLinks: { deleteMany: {}, create: [] },
    });
    expect(result).toMatchObject({
      ok: true,
      decision: {
        decidedAt: null,
        meetingId: null,
        labels: [],
      },
    });
  });

  it("returns notFound when no user-owned decision is updated", async () => {
    mocks.decisionUpdate.mockRejectedValue(new Error("Record not found"));

    const result = await updateDecision("decision-1", "user-1", {
      title: "Adopt new reporting cadence",
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });
});
