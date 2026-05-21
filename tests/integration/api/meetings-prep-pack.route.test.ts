import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingRecord } from "@/types/api";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type GeneratePrepPack = (
  meetingId: string,
  userId: string,
) => Promise<
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }
>;
type ClearMeetingPrepPack = (
  meetingId: string,
  userId: string,
) => Promise<
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }
>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;
type EnforceMonthly = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

const mocks = vi.hoisted(() => ({
  clearMeetingPrepPack: vi.fn<ClearMeetingPrepPack>(),
  enforcePrepPackMonthly: vi.fn<EnforceMonthly>(),
  enforceToolCallsMonthly: vi.fn<EnforceMonthly>(),
  generatePrepPack: vi.fn<GeneratePrepPack>(),
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
  enforcePrepPackMonthly: mocks.enforcePrepPackMonthly,
  enforceToolCallsMonthly: mocks.enforceToolCallsMonthly,
}));

vi.mock("@/lib/features/meetings", () => ({
  clearMeetingPrepPack: mocks.clearMeetingPrepPack,
  generatePrepPack: mocks.generatePrepPack,
}));

import { DELETE, POST } from "@/app/api/meetings/[id]/prep-pack/route";

const meetingRecord: MeetingRecord = {
  id: "meeting-1",
  title: "Board prep",
  scheduledAt: "2026-06-01T08:00:00.000Z",
  durationMin: 45,
  location: "HQ",
  agenda: "Review packet",
  summary: null,
  prepPack: "# Goal\nPrepare the board discussion.",
  status: "upcoming",
  kind: "meeting",
  source: "manual",
  googleEventId: null,
  labels: [],
  participants: [],
  tasks: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "meeting-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/meetings/[id]/prep-pack route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforcePrepPackMonthly.mockResolvedValue({ allowed: true });
    mocks.enforceToolCallsMonthly.mockResolvedValue({ allowed: true });
    mocks.generatePrepPack.mockResolvedValue({ ok: true, meeting: meetingRecord });
    mocks.clearMeetingPrepPack.mockResolvedValue({
      ok: true,
      meeting: { ...meetingRecord, prepPack: null },
    });
  });

  it("generates a prep pack through auth, rate-limit, quota gates, and logic", async () => {
    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/prep-pack", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ meeting: meetingRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforcePrepPackMonthly).toHaveBeenCalledWith("user-1");
    expect(mocks.enforceToolCallsMonthly).toHaveBeenCalledWith("user-1");
    expect(mocks.generatePrepPack).toHaveBeenCalledWith("meeting-1", "user-1");
  });

  it("returns 403 when prep pack quota blocks generation", async () => {
    mocks.enforcePrepPackMonthly.mockResolvedValue({
      allowed: false,
      reason: "Prep pack limit reached.",
    });

    const response = await POST(
      new Request("http://localhost/api/meetings/meeting-1/prep-pack", {
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Prep pack limit reached.",
    });
    expect(mocks.enforceToolCallsMonthly).not.toHaveBeenCalled();
    expect(mocks.generatePrepPack).not.toHaveBeenCalled();
  });

  it("returns 404 or 500 for prep pack generation failures", async () => {
    mocks.generatePrepPack.mockResolvedValueOnce({
      ok: false,
      notFound: true,
    });

    const notFoundResponse = await POST(
      new Request("http://localhost/api/meetings/meeting-1/prep-pack", {
        method: "POST",
      }),
      params(),
    );

    expect(notFoundResponse.status).toBe(404);
    await expect(notFoundResponse.json()).resolves.toEqual({
      error: "Meeting not found.",
    });

    mocks.generatePrepPack.mockResolvedValueOnce({
      ok: false,
      notFound: false,
      error: "LLM call failed.",
    });

    const errorResponse = await POST(
      new Request("http://localhost/api/meetings/meeting-1/prep-pack", {
        method: "POST",
      }),
      params(),
    );

    expect(errorResponse.status).toBe(500);
    await expect(errorResponse.json()).resolves.toEqual({
      error: "LLM call failed.",
    });
  });

  it("clears a prep pack through auth, rate-limit, and logic without consuming quota", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/meetings/meeting-1/prep-pack", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      meeting: { ...meetingRecord, prepPack: null },
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforcePrepPackMonthly).not.toHaveBeenCalled();
    expect(mocks.enforceToolCallsMonthly).not.toHaveBeenCalled();
    expect(mocks.clearMeetingPrepPack).toHaveBeenCalledWith(
      "meeting-1",
      "user-1",
    );
  });

  it("returns 404 when clearing a missing or unowned prep pack", async () => {
    mocks.clearMeetingPrepPack.mockResolvedValue({
      ok: false,
      notFound: true,
    });

    const response = await DELETE(
      new Request("http://localhost/api/meetings/meeting-1/prep-pack", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Meeting not found.",
    });
  });
});
