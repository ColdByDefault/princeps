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

type MemoryEntryCreateArgs = {
  data: {
    userId: string;
    key: string;
    value: string;
    source: "llm" | "user";
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  memoryEntryCreate: vi.fn<
    (args: MemoryEntryCreateArgs) => Promise<DbMemoryEntryRow>
  >(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    memoryEntry: {
      create: mocks.memoryEntryCreate,
    },
  },
}));

import { createMemoryEntry } from "@/lib/memory/create.logic";

describe("createMemoryEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists a user-scoped memory entry and returns a client-safe record", async () => {
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    mocks.memoryEntryCreate.mockResolvedValue({
      id: "memory-1",
      key: "communication.preference",
      value: "User prefers concise follow-ups.",
      source: "user",
      createdAt,
      updatedAt,
    });

    const record = await createMemoryEntry("user-1", {
      key: "communication.preference",
      value: "User prefers concise follow-ups.",
    });

    expect(mocks.memoryEntryCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
        source: "user",
      },
      select: expect.objectContaining({ id: true, key: true }),
    });

    const expectedRecord: MemoryEntryRecord = {
      id: "memory-1",
      key: "communication.preference",
      value: "User prefers concise follow-ups.",
      source: "user",
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });

  it("supports explicit llm-sourced memory entries", async () => {
    mocks.memoryEntryCreate.mockResolvedValue({
      id: "memory-1",
      key: "communication.preference",
      value: "User prefers concise follow-ups.",
      source: "llm",
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
    });

    await createMemoryEntry(
      "user-1",
      {
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
      },
      "llm",
    );

    const createArgs = mocks.memoryEntryCreate.mock.calls[0]?.[0];
    expect(createArgs?.data.source).toBe("llm");
  });
});
