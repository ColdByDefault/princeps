import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRecord } from "@/types/api";
import type { GoalLinkRow, LabelLinkRow } from "@/tests/helpers/db-rows";

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
  goalLinks: GoalLinkRow[];
  labelLinks: LabelLinkRow[];
};

type TaskUpdateArgs = {
  where: { id: string; userId: string };
  data: {
    title?: string;
    notes?: string | null;
    status?: string;
    priority?: string;
    dueDate?: Date | null;
    meetingId?: string | null;
    labelLinks?: {
      deleteMany: Record<string, never>;
      create: { labelId: string }[];
    };
    goalLinks?: {
      deleteMany: Record<string, never>;
      create: { goalId: string }[];
    };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  taskUpdate: vi.fn<(args: TaskUpdateArgs) => Promise<DbTaskRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    task: {
      update: mocks.taskUpdate,
    },
  },
}));

import { updateTask } from "@/lib/features/tasks/update.logic";

const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeTaskRow(overrides: Partial<DbTaskRow> = {}): DbTaskRow {
  return {
    id: "task-1",
    title: "Prepare board packet",
    notes: null,
    status: "done",
    priority: "urgent",
    dueDate: new Date("2026-06-01T08:00:00.000Z"),
    meetingId: null,
    meeting: null,
    createdAt: new Date("2026-05-08T06:00:00.000Z"),
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
    ...overrides,
  };
}

describe("updateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a user-scoped task, dedupes relations, and maps the result", async () => {
    mocks.taskUpdate.mockResolvedValue(makeTaskRow());

    const result = await updateTask("task-1", "user-1", {
      title: "Prepare board packet",
      notes: null,
      status: "done",
      priority: "urgent",
      dueDate: "2026-06-01T08:00:00Z",
      meetingId: null,
      labelIds: ["label-1", "label-1"],
      goalIds: ["goal-1", "goal-1"],
    });

    const updateArgs = mocks.taskUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: "task-1", userId: "user-1" });
    expect(updateArgs?.data).toMatchObject({
      title: "Prepare board packet",
      notes: null,
      status: "done",
      priority: "urgent",
      meetingId: null,
      labelLinks: {
        deleteMany: {},
        create: [{ labelId: "label-1" }],
      },
      goalLinks: {
        deleteMany: {},
        create: [{ goalId: "goal-1" }],
      },
    });
    expect(updateArgs?.data.dueDate).toBeInstanceOf(Date);
    expect(updateArgs?.data.dueDate?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedTask: TaskRecord = {
      id: "task-1",
      title: "Prepare board packet",
      notes: null,
      status: "done",
      priority: "urgent",
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
    expect(result).toEqual({ ok: true, task: expectedTask });
  });

  it("clears dates and relation links when explicit nulls and empty arrays are provided", async () => {
    mocks.taskUpdate.mockResolvedValue(
      makeTaskRow({
        dueDate: null,
        goalLinks: [],
        labelLinks: [],
      }),
    );

    const result = await updateTask("task-1", "user-1", {
      dueDate: null,
      labelIds: [],
      goalIds: [],
    });

    const updateArgs = mocks.taskUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data).toMatchObject({
      dueDate: null,
      labelLinks: { deleteMany: {}, create: [] },
      goalLinks: { deleteMany: {}, create: [] },
    });
    expect(result).toMatchObject({
      ok: true,
      task: {
        dueDate: null,
        goals: [],
        labels: [],
      },
    });
  });

  it("returns notFound when no user-owned task is updated", async () => {
    mocks.taskUpdate.mockRejectedValue(new Error("Record not found"));

    const result = await updateTask("task-1", "user-1", {
      title: "Prepare board packet",
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });
});
