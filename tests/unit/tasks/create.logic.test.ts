import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRecord } from "@/types/api";

type DbTaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  meetingId: string | null;
  meeting: { title: string } | null;
  createdAt: Date;
  updatedAt: Date;
  goalLinks: { goal: { id: string; title: string } }[];
  labelLinks: {
    label: { id: string; name: string; color: string; icon: string | null };
  }[];
};

type TaskCreateArgs = {
  data: {
    userId: string;
    title: string;
    notes: string | null;
    priority: string;
    dueDate: Date | null;
    meetingId?: string | null;
    labelLinks?: { create: { labelId: string }[] };
    goalLinks?: { create: { goalId: string }[] };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  taskCreate: vi.fn<(args: TaskCreateArgs) => Promise<DbTaskRow>>(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      create: mocks.taskCreate,
    },
  },
}));

import { createTask } from "@/lib/tasks/create.logic";

describe("createTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists user-scoped task data and returns a client-safe record", async () => {
    const dueDate = new Date("2026-06-01T08:00:00.000Z");
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    const row: DbTaskRow = {
      id: "task-1",
      title: "Prepare board packet",
      notes: "Draft the decision brief.",
      status: "open",
      priority: "high",
      dueDate,
      meetingId: null,
      meeting: null,
      createdAt,
      updatedAt,
      goalLinks: [{ goal: { id: "goal-1", title: "Board readiness" } }],
      labelLinks: [
        {
          label: {
            id: "label-1",
            name: "Board",
            color: "#64748b",
            icon: null,
          },
        },
      ],
    };
    mocks.taskCreate.mockResolvedValue(row);

    const record = await createTask("user-1", {
      title: "Prepare board packet",
      notes: "Draft the decision brief.",
      priority: "high",
      dueDate: "2026-06-01T08:00:00Z",
      meetingId: null,
      labelIds: ["label-1"],
      goalIds: ["goal-1"],
    });

    const createArgs = mocks.taskCreate.mock.calls[0]?.[0];
    expect(createArgs?.data).toMatchObject({
      userId: "user-1",
      title: "Prepare board packet",
      notes: "Draft the decision brief.",
      priority: "high",
      meetingId: null,
      labelLinks: { create: [{ labelId: "label-1" }] },
      goalLinks: { create: [{ goalId: "goal-1" }] },
    });
    expect(createArgs?.data.dueDate).toBeInstanceOf(Date);
    expect(createArgs?.data.dueDate?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedRecord: TaskRecord = {
      id: "task-1",
      title: "Prepare board packet",
      notes: "Draft the decision brief.",
      status: "open",
      priority: "high",
      dueDate: "2026-06-01T08:00:00.000Z",
      meetingId: null,
      meetingTitle: null,
      goals: [{ id: "goal-1", title: "Board readiness" }],
      labels: [
        { id: "label-1", name: "Board", color: "#64748b", icon: null },
      ],
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });
});
