import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalRecord } from "@/types/api";
import type { LabelLinkRow, TaskLinkRow } from "@/tests/helpers/db-rows";

type DbGoalRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetDate: Date | null;
  meetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  taskLinks: TaskLinkRow[];
  labelLinks: LabelLinkRow[];
};

type GoalUpdateArgs = {
  where: { id: string; userId: string };
  data: {
    title?: string;
    description?: string | null;
    status?: string;
    targetDate?: Date | null;
    meetingId?: string | null;
    labelLinks?: {
      deleteMany: Record<string, never>;
      create: { labelId: string }[];
    };
    taskLinks?: {
      deleteMany: Record<string, never>;
      create: { taskId: string }[];
    };
    milestones?: {
      deleteMany: Record<string, never>;
      create: { title: string; completed: boolean; position: number }[];
    };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  goalUpdate: vi.fn<(args: GoalUpdateArgs) => Promise<DbGoalRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    goal: {
      update: mocks.goalUpdate,
    },
  },
}));

import { updateGoal } from "@/lib/features/goals/update.logic";

const createdAt = new Date("2026-05-08T06:00:00.000Z");
const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeGoalRow(overrides: Partial<DbGoalRow> = {}): DbGoalRow {
  return {
    id: "goal-1",
    title: "Launch v2",
    description: null,
    status: "in_progress",
    targetDate: new Date("2026-06-01T08:00:00.000Z"),
    meetingId: null,
    createdAt,
    updatedAt,
    milestones: [
      {
        id: "milestone-1",
        title: "Backend ready",
        completed: true,
        position: 2,
        createdAt,
        updatedAt,
      },
    ],
    taskLinks: [
      { task: { id: "task-1", title: "Prepare launch checklist", status: "open" } },
    ],
    labelLinks: [
      {
        label: {
          id: "label-1",
          name: "Product",
          color: "#2563eb",
          icon: null,
        },
      },
    ],
    ...overrides,
  };
}

describe("updateGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a user-scoped goal, replaces links and milestones, and maps the result", async () => {
    mocks.goalUpdate.mockResolvedValue(makeGoalRow());

    const result = await updateGoal("goal-1", "user-1", {
      title: "Launch v2",
      description: null,
      status: "in_progress",
      targetDate: "2026-06-01T08:00:00Z",
      meetingId: null,
      labelIds: ["label-1", "label-1"],
      taskIds: ["task-1", "task-1"],
      milestones: [{ title: "Backend ready", completed: true, position: 2 }],
    });

    const updateArgs = mocks.goalUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: "goal-1", userId: "user-1" });
    expect(updateArgs?.data).toMatchObject({
      title: "Launch v2",
      description: null,
      status: "in_progress",
      meetingId: null,
      labelLinks: {
        deleteMany: {},
        create: [{ labelId: "label-1" }],
      },
      taskLinks: {
        deleteMany: {},
        create: [{ taskId: "task-1" }],
      },
      milestones: {
        deleteMany: {},
        create: [{ title: "Backend ready", completed: true, position: 2 }],
      },
    });
    expect(updateArgs?.data.targetDate).toBeInstanceOf(Date);
    expect(updateArgs?.data.targetDate?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedGoal: GoalRecord = {
      id: "goal-1",
      title: "Launch v2",
      description: null,
      status: "in_progress",
      targetDate: "2026-06-01T08:00:00.000Z",
      meetingId: null,
      milestones: [
        {
          id: "milestone-1",
          title: "Backend ready",
          completed: true,
          position: 2,
          createdAt: "2026-05-08T06:00:00.000Z",
          updatedAt: "2026-05-08T06:30:00.000Z",
        },
      ],
      tasks: [{ id: "task-1", title: "Prepare launch checklist", status: "open" }],
      labels: [
        { id: "label-1", name: "Product", color: "#2563eb", icon: null },
      ],
      stakeholders: [],
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(result).toEqual({ ok: true, goal: expectedGoal });
  });

  it("clears dates, links, and milestones when explicit nulls and empty arrays are provided", async () => {
    mocks.goalUpdate.mockResolvedValue(
      makeGoalRow({
        targetDate: null,
        meetingId: null,
        milestones: [],
        taskLinks: [],
        labelLinks: [],
      }),
    );

    const result = await updateGoal("goal-1", "user-1", {
      targetDate: null,
      meetingId: null,
      labelIds: [],
      taskIds: [],
      milestones: [],
    });

    const updateArgs = mocks.goalUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data).toMatchObject({
      targetDate: null,
      meetingId: null,
      labelLinks: { deleteMany: {}, create: [] },
      taskLinks: { deleteMany: {}, create: [] },
      milestones: { deleteMany: {}, create: [] },
    });
    expect(result).toMatchObject({
      ok: true,
      goal: {
        targetDate: null,
        meetingId: null,
        milestones: [],
        tasks: [],
        labels: [],
      },
    });
  });

  it("defaults replacement milestone fields by position in the provided array", async () => {
    mocks.goalUpdate.mockResolvedValue(makeGoalRow());

    await updateGoal("goal-1", "user-1", {
      milestones: [{ title: "Backend ready" }, { title: "Frontend ready" }],
    });

    const updateArgs = mocks.goalUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data.milestones?.create).toEqual([
      { title: "Backend ready", completed: false, position: 0 },
      { title: "Frontend ready", completed: false, position: 1 },
    ]);
  });

  it("returns notFound when no user-owned goal is updated", async () => {
    mocks.goalUpdate.mockRejectedValue(new Error("Record not found"));

    const result = await updateGoal("goal-1", "user-1", {
      title: "Launch v2",
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });
});
