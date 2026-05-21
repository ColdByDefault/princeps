import { beforeEach, describe, expect, it, vi } from "vitest";

type TaskDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  taskDeleteMany: vi.fn<(args: TaskDeleteManyArgs) => Promise<{ count: number }>>(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      deleteMany: mocks.taskDeleteMany,
    },
  },
}));

import { deleteTask } from "@/lib/tasks/delete.logic";

describe("deleteTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a user-owned task", async () => {
    mocks.taskDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteTask("task-1", "user-1");

    expect(mocks.taskDeleteMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned task is deleted", async () => {
    mocks.taskDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteTask("task-1", "user-1");

    expect(result).toEqual({ ok: false });
  });
});
