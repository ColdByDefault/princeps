import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MilestoneRecord } from "@/types/api";

type DbMilestoneRow = {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type GoalFindFirstArgs = {
  where: { id: string; userId: string };
  select: { id: true };
};

type MilestoneFindFirstArgs = {
  where: { id: string; goalId: string; goal: { userId: string } };
  select: { id: true };
};

type MilestoneCreateArgs = {
  data: {
    goalId: string;
    title: string;
    position: number;
  };
  select: unknown;
};

type MilestoneUpdateArgs = {
  where: { id: string };
  data: {
    title?: string;
    completed?: boolean;
    position?: number;
  };
  select: unknown;
};

type MilestoneDeleteManyArgs = {
  where: { id: string; goalId: string; goal: { userId: string } };
};

const mocks = vi.hoisted(() => ({
  goalFindFirst: vi.fn<(args: GoalFindFirstArgs) => Promise<{ id: string } | null>>(),
  milestoneCreate: vi.fn<
    (args: MilestoneCreateArgs) => Promise<DbMilestoneRow>
  >(),
  milestoneDeleteMany: vi.fn<
    (args: MilestoneDeleteManyArgs) => Promise<{ count: number }>
  >(),
  milestoneFindFirst: vi.fn<
    (args: MilestoneFindFirstArgs) => Promise<{ id: string } | null>
  >(),
  milestoneUpdate: vi.fn<
    (args: MilestoneUpdateArgs) => Promise<DbMilestoneRow>
  >(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    goal: {
      findFirst: mocks.goalFindFirst,
    },
    milestone: {
      create: mocks.milestoneCreate,
      deleteMany: mocks.milestoneDeleteMany,
      findFirst: mocks.milestoneFindFirst,
      update: mocks.milestoneUpdate,
    },
  },
}));

import {
  createMilestone,
  deleteMilestone,
  updateMilestone,
} from "@/lib/goals/milestones.logic";

const createdAt = new Date("2026-05-08T06:00:00.000Z");
const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeMilestoneRow(
  overrides: Partial<DbMilestoneRow> = {},
): DbMilestoneRow {
  return {
    id: "milestone-1",
    title: "Backend ready",
    completed: false,
    position: 0,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe("milestone logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a milestone only after verifying goal ownership", async () => {
    mocks.goalFindFirst.mockResolvedValue({ id: "goal-1" });
    mocks.milestoneCreate.mockResolvedValue(makeMilestoneRow({ position: 2 }));

    const record = await createMilestone("goal-1", "user-1", {
      title: "Backend ready",
      position: 2,
    });

    expect(mocks.goalFindFirst).toHaveBeenCalledWith({
      where: { id: "goal-1", userId: "user-1" },
      select: { id: true },
    });
    expect(mocks.milestoneCreate).toHaveBeenCalledWith({
      data: {
        goalId: "goal-1",
        title: "Backend ready",
        position: 2,
      },
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecord: MilestoneRecord = {
      id: "milestone-1",
      title: "Backend ready",
      completed: false,
      position: 2,
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });

  it("returns null when creating under a missing or unowned goal", async () => {
    mocks.goalFindFirst.mockResolvedValue(null);

    const record = await createMilestone("goal-1", "user-1", {
      title: "Backend ready",
    });

    expect(record).toBeNull();
    expect(mocks.milestoneCreate).not.toHaveBeenCalled();
  });

  it("updates a milestone only after verifying milestone ownership through the goal", async () => {
    mocks.milestoneFindFirst.mockResolvedValue({ id: "milestone-1" });
    mocks.milestoneUpdate.mockResolvedValue(
      makeMilestoneRow({ completed: true, position: 1 }),
    );

    const record = await updateMilestone("milestone-1", "goal-1", "user-1", {
      title: "Backend ready",
      completed: true,
      position: 1,
    });

    expect(mocks.milestoneFindFirst).toHaveBeenCalledWith({
      where: { id: "milestone-1", goalId: "goal-1", goal: { userId: "user-1" } },
      select: { id: true },
    });
    expect(mocks.milestoneUpdate).toHaveBeenCalledWith({
      where: { id: "milestone-1" },
      data: {
        title: "Backend ready",
        completed: true,
        position: 1,
      },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(record).toMatchObject({
      id: "milestone-1",
      completed: true,
      position: 1,
    });
  });

  it("returns null when updating a missing or unowned milestone", async () => {
    mocks.milestoneFindFirst.mockResolvedValue(null);

    const record = await updateMilestone("milestone-1", "goal-1", "user-1", {
      completed: true,
    });

    expect(record).toBeNull();
    expect(mocks.milestoneUpdate).not.toHaveBeenCalled();
  });

  it("deletes only a milestone owned through the goal relation", async () => {
    mocks.milestoneDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteMilestone("milestone-1", "goal-1", "user-1");

    expect(mocks.milestoneDeleteMany).toHaveBeenCalledWith({
      where: { id: "milestone-1", goalId: "goal-1", goal: { userId: "user-1" } },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned milestone is deleted", async () => {
    mocks.milestoneDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteMilestone("milestone-1", "goal-1", "user-1");

    expect(result).toEqual({ ok: false });
  });
});
