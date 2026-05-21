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

type MemoryEntryUpdateArgs = {
  where: { id: string; userId: string };
  data: {
    key?: string;
    value?: string;
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  memoryEntryUpdate: vi.fn<
    (args: MemoryEntryUpdateArgs) => Promise<DbMemoryEntryRow>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    memoryEntry: {
      update: mocks.memoryEntryUpdate,
    },
  },
}));

import { updateMemoryEntry } from "@/lib/features/memory/update.logic";

describe("updateMemoryEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a user-scoped memory entry and maps the result", async () => {
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    mocks.memoryEntryUpdate.mockResolvedValue({
      id: "memory-1",
      key: "communication.preference",
      value: "User prefers a short summary first.",
      source: "user",
      createdAt,
      updatedAt,
    });

    const record = await updateMemoryEntry("user-1", "memory-1", {
      key: "communication.preference",
      value: "User prefers a short summary first.",
    });

    expect(mocks.memoryEntryUpdate).toHaveBeenCalledWith({
      where: { id: "memory-1", userId: "user-1" },
      data: {
        key: "communication.preference",
        value: "User prefers a short summary first.",
      },
      select: expect.objectContaining({ id: true, key: true }),
    });

    const expectedRecord: MemoryEntryRecord = {
      id: "memory-1",
      key: "communication.preference",
      value: "User prefers a short summary first.",
      source: "user",
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });

  it("updates only supplied fields", async () => {
    mocks.memoryEntryUpdate.mockResolvedValue({
      id: "memory-1",
      key: "communication.preference",
      value: "User prefers a short summary first.",
      source: "user",
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
    });

    await updateMemoryEntry("user-1", "memory-1", {
      value: "User prefers a short summary first.",
    });

    const updateArgs = mocks.memoryEntryUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data).toEqual({
      value: "User prefers a short summary first.",
    });
  });

  it("returns null when no user-owned memory entry is updated", async () => {
    mocks.memoryEntryUpdate.mockRejectedValue(new Error("Record not found"));

    const record = await updateMemoryEntry("user-1", "memory-1", {
      value: "User prefers a short summary first.",
    });

    expect(record).toBeNull();
  });
});
