import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BriefingRecord } from "@/types/api";

type GetBriefing = (userId: string) => Promise<BriefingRecord | null>;
type GenerateBriefing = (
  userId: string,
) => Promise<{ ok: true; briefing: BriefingRecord } | { ok: false; error: string }>;
type EnforceBriefingMonthly = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  enforceBriefingMonthly: vi.fn<EnforceBriefingMonthly>(),
  generateBriefing: vi.fn<GenerateBriefing>(),
  getBriefing: vi.fn<GetBriefing>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
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

vi.mock("@/lib/platform/tiers", () => ({
  createTierLimitResponse: (reason = "Plan limit reached.") =>
    Response.json({ error: reason }, { status: 403 }),
  enforceBriefingMonthly: mocks.enforceBriefingMonthly,
}));

vi.mock("@/lib/features/briefings", () => ({
  generateBriefing: mocks.generateBriefing,
  getBriefing: mocks.getBriefing,
}));

import { GET, POST } from "@/app/api/briefings/route";

const briefingRecord: BriefingRecord = {
  id: "briefing-1",
  content: "### Good morning\nFocus on launch readiness.",
  generatedAt: "2026-05-22T08:00:00.000Z",
};

describe("/api/briefings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getBriefing.mockResolvedValue(briefingRecord);
    mocks.generateBriefing.mockResolvedValue({
      ok: true,
      briefing: briefingRecord,
    });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceBriefingMonthly.mockResolvedValue({ allowed: true });
  });

  it("returns the cached briefing for the authenticated user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ briefing: briefingRecord });
    expect(mocks.getBriefing).toHaveBeenCalledWith("user-1");
  });

  it("regenerates a briefing through auth, rate-limit, quota, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/briefings", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ briefing: briefingRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceBriefingMonthly).toHaveBeenCalledWith("user-1");
    expect(mocks.generateBriefing).toHaveBeenCalledWith("user-1");
  });

  it("returns 403 when the briefing quota blocks regeneration", async () => {
    mocks.enforceBriefingMonthly.mockResolvedValue({
      allowed: false,
      reason: "Monthly briefing limit reached.",
    });

    const response = await POST(
      new Request("http://localhost/api/briefings", { method: "POST" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Monthly briefing limit reached.",
    });
    expect(mocks.generateBriefing).not.toHaveBeenCalled();
  });

  it("returns 500 when briefing generation fails", async () => {
    mocks.generateBriefing.mockResolvedValue({
      ok: false,
      error: "LLM call failed.",
    });

    const response = await POST(
      new Request("http://localhost/api/briefings", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "LLM call failed.",
    });
  });
});
