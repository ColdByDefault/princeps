import { beforeEach, describe, expect, it, vi } from "vitest";

type MemoryEntryDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  memoryEntryDeleteMany: vi.fn<
    (args: MemoryEntryDeleteManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    memoryEntry: {
      deleteMany: mocks.memoryEntryDeleteMany,
    },
  },
}));

import { deleteMemoryEntry } from "@/lib/features/memory/delete.logic";

describe("deleteMemoryEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a user-owned memory entry", async () => {
    mocks.memoryEntryDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteMemoryEntry("user-1", "memory-1");

    expect(mocks.memoryEntryDeleteMany).toHaveBeenCalledWith({
      where: { id: "memory-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned memory entry is deleted", async () => {
    mocks.memoryEntryDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteMemoryEntry("user-1", "memory-1");

    expect(result).toEqual({ ok: false });
  });
});
