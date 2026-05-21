import { beforeEach, describe, expect, it, vi } from "vitest";

type DecisionDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  decisionDeleteMany: vi.fn<
    (args: DecisionDeleteManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    decision: {
      deleteMany: mocks.decisionDeleteMany,
    },
  },
}));

import { deleteDecision } from "@/lib/decisions/delete.logic";

describe("deleteDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a user-owned decision", async () => {
    mocks.decisionDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteDecision("decision-1", "user-1");

    expect(mocks.decisionDeleteMany).toHaveBeenCalledWith({
      where: { id: "decision-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned decision is deleted", async () => {
    mocks.decisionDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteDecision("decision-1", "user-1");

    expect(result).toEqual({ ok: false });
  });
});
