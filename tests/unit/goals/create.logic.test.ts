import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalRecord } from "@/types/api";

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
  taskLinks: { task: { id: string; title: string; status: string } }[];
  labelLinks: {
    label: { id: string; name: string; color: string; icon: string | null };
  }[];
};

type GoalCreateArgs = {
  data: {
    userId: string;
    title: string;
    description: string | null;
    status: string;
    targetDate: Date | null;
    meetingId: string | null;
    labelLinks?: { create: { labelId: string }[] };
    taskLinks?: { create: { taskId: string }[] };
    milestones?: {
      create: { title: string; completed: boolean; position: number }[];
    };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  goalCreate: vi.fn<(args: GoalCreateArgs) => Promise<DbGoalRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    goal: {
      create: mocks.goalCreate,
    },
  },
}));

import { createGoal } from "@/lib/features/goals/create.logic";

describe("createGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists user-scoped goal data with linked labels, tasks, and milestones", async () => {
    const targetDate = new Date("2026-06-01T08:00:00.000Z");
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    const row: DbGoalRow = {
      id: "goal-1",
      title: "Launch v2",
      description: "Ship the next major release.",
      status: "in_progress",
      targetDate,
      meetingId: "meeting-1",
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
        {
          id: "milestone-2",
          title: "Frontend ready",
          completed: false,
          position: 1,
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
    };
    mocks.goalCreate.mockResolvedValue(row);

    const record = await createGoal("user-1", {
      title: "Launch v2",
      description: "Ship the next major release.",
      status: "in_progress",
      targetDate: "2026-06-01T08:00:00Z",
      meetingId: "meeting-1",
      labelIds: ["label-1", "label-1"],
      taskIds: ["task-1", "task-1"],
      milestones: [
        { title: "Backend ready", completed: true, position: 2 },
        { title: "Frontend ready" },
      ],
    });

    const createArgs = mocks.goalCreate.mock.calls[0]?.[0];
    expect(createArgs?.data).toMatchObject({
      userId: "user-1",
      title: "Launch v2",
      description: "Ship the next major release.",
      status: "in_progress",
      meetingId: "meeting-1",
      labelLinks: { create: [{ labelId: "label-1" }] },
      taskLinks: { create: [{ taskId: "task-1" }] },
      milestones: {
        create: [
          { title: "Backend ready", completed: true, position: 2 },
          { title: "Frontend ready", completed: false, position: 1 },
        ],
      },
    });
    expect(createArgs?.data.targetDate).toBeInstanceOf(Date);
    expect(createArgs?.data.targetDate?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedRecord: GoalRecord = {
      id: "goal-1",
      title: "Launch v2",
      description: "Ship the next major release.",
      status: "in_progress",
      targetDate: "2026-06-01T08:00:00.000Z",
      meetingId: "meeting-1",
      milestones: [
        {
          id: "milestone-1",
          title: "Backend ready",
          completed: true,
          position: 2,
          createdAt: "2026-05-08T06:00:00.000Z",
          updatedAt: "2026-05-08T06:30:00.000Z",
        },
        {
          id: "milestone-2",
          title: "Frontend ready",
          completed: false,
          position: 1,
          createdAt: "2026-05-08T06:00:00.000Z",
          updatedAt: "2026-05-08T06:30:00.000Z",
        },
      ],
      tasks: [{ id: "task-1", title: "Prepare launch checklist", status: "open" }],
      labels: [
        { id: "label-1", name: "Product", color: "#2563eb", icon: null },
      ],
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });

  it("defaults missing optional fields for a new open goal", async () => {
    mocks.goalCreate.mockResolvedValue({
      id: "goal-1",
      title: "Launch v2",
      description: null,
      status: "open",
      targetDate: null,
      meetingId: null,
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
      milestones: [],
      taskLinks: [],
      labelLinks: [],
    });

    await createGoal("user-1", { title: "Launch v2" });

    expect(mocks.goalCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        title: "Launch v2",
        description: null,
        status: "open",
        targetDate: null,
        meetingId: null,
      },
      select: expect.objectContaining({ id: true, title: true }),
    });
  });
});
