import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MilestoneRecord } from "@/types/api";
import type { CreateMilestoneInput } from "@/lib/goals/schemas";
import type * as goalSchemas from "@/lib/goals/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type CreateMilestone = (
  goalId: string,
  userId: string,
  input: CreateMilestoneInput,
) => Promise<MilestoneRecord | null>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;

const mocks = vi.hoisted(() => ({
  createMilestone: vi.fn<CreateMilestone>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
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

vi.mock("@/lib/goals", async () => {
  const actual = await vi.importActual<typeof goalSchemas>(
    "@/lib/goals/schemas",
  );

  return {
    createMilestone: mocks.createMilestone,
    createMilestoneSchema: actual.createMilestoneSchema,
  };
});

import { POST } from "@/app/api/goals/[id]/milestones/route";

const milestoneRecord: MilestoneRecord = {
  id: "milestone-1",
  title: "Backend ready",
  completed: false,
  position: 1,
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "goal-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/goals/[id]/milestones route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.createMilestone.mockResolvedValue(milestoneRecord);
  });

  it("creates a milestone through auth, rate-limit, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/goals/goal-1/milestones", {
        body: JSON.stringify({ title: "Backend ready", position: 1 }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      milestone: milestoneRecord,
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.createMilestone).toHaveBeenCalledWith("goal-1", "user-1", {
      title: "Backend ready",
      position: 1,
    });
  });

  it("returns 400 for invalid create milestone input", async () => {
    const response = await POST(
      new Request("http://localhost/api/goals/goal-1/milestones", {
        body: JSON.stringify({ title: "", position: -1 }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.createMilestone).not.toHaveBeenCalled();
  });

  it("returns 404 when the goal is missing or unowned", async () => {
    mocks.createMilestone.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/goals/goal-1/milestones", {
        body: JSON.stringify({ title: "Backend ready" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Goal not found" });
  });
});
