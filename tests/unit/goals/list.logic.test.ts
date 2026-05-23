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
  stakeholderEntries: {
    id: string;
    goalId: string | null;
    contactId: string;
    role: string | null;
    health: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    contact: { name: string };
  }[];
};

type GoalFindManyArgs = {
  where: {
    userId: string;
    status?: "open" | "in_progress" | "done" | "cancelled";
  };
  orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }];
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  goalFindMany: vi.fn<(args: GoalFindManyArgs) => Promise<DbGoalRow[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    goal: {
      findMany: mocks.goalFindMany,
    },
  },
}));

import { listGoals } from "@/lib/features/goals/list.logic";

describe("listGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists goals scoped to the user and maps rows to client-safe records", async () => {
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    mocks.goalFindMany.mockResolvedValue([
      {
        id: "goal-1",
        title: "Launch v2",
        description: "Ship the next major release.",
        status: "in_progress",
        targetDate: new Date("2026-06-01T08:00:00.000Z"),
        meetingId: "meeting-1",
        createdAt,
        updatedAt,
        milestones: [
          {
            id: "milestone-1",
            title: "Backend ready",
            completed: true,
            position: 1,
            createdAt,
            updatedAt,
          },
        ],
        taskLinks: [
          {
            task: {
              id: "task-1",
              title: "Prepare launch checklist",
              status: "open",
            },
          },
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
        stakeholderEntries: [],
      },
    ]);

    const records = await listGoals("user-1");

    expect(mocks.goalFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }],
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecords: GoalRecord[] = [
      {
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
            position: 1,
            createdAt: "2026-05-08T06:00:00.000Z",
            updatedAt: "2026-05-08T06:30:00.000Z",
          },
        ],
        tasks: [
          { id: "task-1", title: "Prepare launch checklist", status: "open" },
        ],
        labels: [
          { id: "label-1", name: "Product", color: "#2563eb", icon: null },
        ],
        stakeholders: [],
        createdAt: "2026-05-08T06:00:00.000Z",
        updatedAt: "2026-05-08T06:30:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });

  it("applies the optional status filter", async () => {
    mocks.goalFindMany.mockResolvedValue([]);

    await listGoals("user-1", { status: "done" });

    const findManyArgs = mocks.goalFindMany.mock.calls[0]?.[0];
    expect(findManyArgs?.where).toEqual({
      userId: "user-1",
      status: "done",
    });
  });
});
