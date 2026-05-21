import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MemoryEntryRecord } from "@/types/api";
import type { CreateMemoryEntryInput } from "@/lib/memory/schemas";
import type * as memorySchemas from "@/lib/memory/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type ListMemoryEntries = (userId: string) => Promise<MemoryEntryRecord[]>;
type CreateMemoryEntry = (
  userId: string,
  input: CreateMemoryEntryInput,
  source?: "llm" | "user",
) => Promise<MemoryEntryRecord>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;
type EnforceMemoryMax = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

const mocks = vi.hoisted(() => ({
  createMemoryEntry: vi.fn<CreateMemoryEntry>(),
  enforceMemoryMax: vi.fn<EnforceMemoryMax>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listMemoryEntries: vi.fn<ListMemoryEntries>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/security", () => ({
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

vi.mock("@/lib/tiers", () => ({
  createTierLimitResponse: (reason = "Plan limit reached.") =>
    Response.json({ error: reason }, { status: 403 }),
  enforceMemoryMax: mocks.enforceMemoryMax,
}));

vi.mock("@/lib/memory", async () => {
  const actual = await vi.importActual<typeof memorySchemas>(
    "@/lib/memory/schemas",
  );

  return {
    createMemoryEntry: mocks.createMemoryEntry,
    createMemoryEntrySchema: actual.createMemoryEntrySchema,
    listMemoryEntries: mocks.listMemoryEntries,
  };
});

import { GET, POST } from "@/app/api/memory/route";

const memoryEntryRecord: MemoryEntryRecord = {
  id: "memory-1",
  key: "communication.preference",
  value: "User prefers concise follow-ups.",
  source: "user",
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

describe("/api/memory route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listMemoryEntries.mockResolvedValue([memoryEntryRecord]);
    mocks.createMemoryEntry.mockResolvedValue(memoryEntryRecord);
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceMemoryMax.mockResolvedValue({ allowed: true });
  });

  it("lists authenticated user memory entries", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      entries: [memoryEntryRecord],
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listMemoryEntries).toHaveBeenCalledWith("user-1");
  });

  it("creates a memory entry through auth, rate-limit, tier, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/memory", {
        body: JSON.stringify({
          key: "communication.preference",
          value: "User prefers concise follow-ups.",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      entry: memoryEntryRecord,
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs =
      mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceMemoryMax).toHaveBeenCalledWith("user-1");
    expect(mocks.createMemoryEntry).toHaveBeenCalledWith(
      "user-1",
      {
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
      },
      "user",
    );
  });

  it("returns 400 for invalid create input", async () => {
    const response = await POST(
      new Request("http://localhost/api/memory", {
        body: JSON.stringify({ key: "", value: "" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createMemoryEntry).not.toHaveBeenCalled();
  });
});
