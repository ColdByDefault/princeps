import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemoryEntryRecord } from "@/types/api";

type DbMemoryEntryRow = {
  id: string;
  key: string;
  value: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

type MemoryEntryFindManyArgs = {
  where: { userId: string };
  select: unknown;
  orderBy: { updatedAt: "desc" };
};

const mocks = vi.hoisted(() => ({
  memoryEntryFindMany: vi.fn<
    (args: MemoryEntryFindManyArgs) => Promise<DbMemoryEntryRow[]>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    memoryEntry: {
      findMany: mocks.memoryEntryFindMany,
    },
  },
}));

import { listMemoryEntries } from "@/lib/features/memory/list.logic";

describe("listMemoryEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists memory entries scoped to the user and maps rows to client-safe records", async () => {
    mocks.memoryEntryFindMany.mockResolvedValue([
      {
        id: "memory-1",
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
        source: "user",
        createdAt: new Date("2026-05-08T06:00:00.000Z"),
        updatedAt: new Date("2026-05-08T06:30:00.000Z"),
      },
    ]);

    const records = await listMemoryEntries("user-1");

    expect(mocks.memoryEntryFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: expect.objectContaining({ id: true, key: true }),
      orderBy: { updatedAt: "desc" },
    });

    const expectedRecords: MemoryEntryRecord[] = [
      {
        id: "memory-1",
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
        source: "user",
        createdAt: "2026-05-08T06:00:00.000Z",
        updatedAt: "2026-05-08T06:30:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });
});
