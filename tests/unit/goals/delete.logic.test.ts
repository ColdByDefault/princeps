import { beforeEach, describe, expect, it, vi } from "vitest";

type GoalDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  goalDeleteMany: vi.fn<
    (args: GoalDeleteManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    goal: {
      deleteMany: mocks.goalDeleteMany,
    },
  },
}));

import { deleteGoal } from "@/lib/features/goals/delete.logic";

describe("deleteGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a user-owned goal", async () => {
    mocks.goalDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteGoal("goal-1", "user-1");

    expect(mocks.goalDeleteMany).toHaveBeenCalledWith({
      where: { id: "goal-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned goal is deleted", async () => {
    mocks.goalDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteGoal("goal-1", "user-1");

    expect(result).toEqual({ ok: false });
  });
});
