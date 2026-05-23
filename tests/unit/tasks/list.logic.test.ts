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

type TaskFindManyArgs = {
  where: {
    userId: string;
    status?: "open" | "in_progress" | "done" | "cancelled";
  };
  orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }];
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  taskFindMany: vi.fn<(args: TaskFindManyArgs) => Promise<DbTaskRow[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    task: {
      findMany: mocks.taskFindMany,
    },
  },
}));

import { listTasks } from "@/lib/features/tasks/list.logic";

describe("listTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists tasks scoped to the user and maps rows to client-safe records", async () => {
    const row: DbTaskRow = {
      id: "task-1",
      title: "Prepare board packet",
      notes: "Draft the decision brief.",
      status: "open",
      priority: "high",
      dueDate: new Date("2026-06-01T08:00:00.000Z"),
      meetingId: "meeting-1",
      meeting: { title: "Board prep" },
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
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
    mocks.taskFindMany.mockResolvedValue([row]);

    const records = await listTasks("user-1");

    expect(mocks.taskFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecords: TaskRecord[] = [
      {
        id: "task-1",
        title: "Prepare board packet",
        notes: "Draft the decision brief.",
        status: "open",
        priority: "high",
        dueDate: "2026-06-01T08:00:00.000Z",
        meetingId: "meeting-1",
        meetingTitle: "Board prep",
        goals: [{ id: "goal-1", title: "Board readiness" }],
        labels: [
          { id: "label-1", name: "Board", color: "#64748b", icon: null },
        ],
        delegatedTo: null,
        delegatedAt: null,
        delegateNotes: null,
        createdAt: "2026-05-08T06:00:00.000Z",
        updatedAt: "2026-05-08T06:30:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });

  it("applies the optional status filter", async () => {
    mocks.taskFindMany.mockResolvedValue([]);

    await listTasks("user-1", { status: "done" });

    const findManyArgs = mocks.taskFindMany.mock.calls[0]?.[0];
    expect(findManyArgs?.where).toEqual({
      userId: "user-1",
      status: "done",
    });
  });
});
