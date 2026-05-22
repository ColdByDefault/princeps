import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemoryEntryRecord } from "@/types/api";
import type { UpdateMemoryEntryInput } from "@/lib/features/memory/schemas";
import type * as memorySchemas from "@/lib/features/memory/schemas";

type UpdateMemoryEntry = (
  userId: string,
  id: string,
  input: UpdateMemoryEntryInput,
) => Promise<MemoryEntryRecord | null>;
type DeleteMemoryEntry = (
  userId: string,
  id: string,
) => Promise<{ ok: boolean }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  deleteMemoryEntry: vi.fn<DeleteMemoryEntry>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateMemoryEntry: vi.fn<UpdateMemoryEntry>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/core/security", () => ({
  createRateLimitResponse: (retryAfterSeconds: number) =>
    Response.json(
      { error: "Too many requests" },
      {
        headers: { "Retry-After": String(retryAfterSeconds) },
        status: 429,
      },
    ),
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
  writeRateLimiter: {
    check: mocks.rateLimitCheck,
  },
}));

vi.mock("@/lib/features/memory", async () => {
  const actual = await vi.importActual<typeof memorySchemas>(
    "@/lib/features/memory/schemas",
  );

  return {
    deleteMemoryEntry: mocks.deleteMemoryEntry,
    updateMemoryEntry: mocks.updateMemoryEntry,
    updateMemoryEntrySchema: actual.updateMemoryEntrySchema,
  };
});

import { DELETE, PATCH } from "@/app/api/memory/[id]/route";

const memoryEntryRecord: MemoryEntryRecord = {
  id: "memory-1",
  key: "communication.preference",
  value: "User prefers a short summary first.",
  source: "user",
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "memory-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/memory/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateMemoryEntry.mockResolvedValue(memoryEntryRecord);
    mocks.deleteMemoryEntry.mockResolvedValue({ ok: true });
  });

  it("patches a memory entry through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/memory/memory-1", {
        body: JSON.stringify({
          value: "User prefers a short summary first.",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      entry: memoryEntryRecord,
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateMemoryEntry).toHaveBeenCalledWith(
      "user-1",
      "memory-1",
      {
        value: "User prefers a short summary first.",
      },
    );
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/memory/memory-1", {
        body: JSON.stringify({ value: "" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateMemoryEntry).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned memory entry", async () => {
    mocks.updateMemoryEntry.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/memory/memory-1", {
        body: JSON.stringify({ key: "communication.preference" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Memory entry not found",
    });
  });

  it("deletes a memory entry through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/memory/memory-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteMemoryEntry).toHaveBeenCalledWith("user-1", "memory-1");
  });

  it("returns 404 when deleting a missing or unowned memory entry", async () => {
    mocks.deleteMemoryEntry.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/memory/memory-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Memory entry not found",
    });
  });
});
