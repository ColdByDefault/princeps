import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalRecord } from "@/types/api";
import type { CreateGoalInput } from "@/lib/features/goals/schemas";
import type * as goalSchemas from "@/lib/features/goals/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type GoalStatus = "open" | "in_progress" | "done" | "cancelled";
type ListGoals = (
  userId: string,
  filter?: { status?: GoalStatus },
) => Promise<GoalRecord[]>;
type CreateGoal = (
  userId: string,
  input: CreateGoalInput,
) => Promise<GoalRecord>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;
type EnforceGoalsMax = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

const mocks = vi.hoisted(() => ({
  createGoal: vi.fn<CreateGoal>(),
  enforceGoalsMax: vi.fn<EnforceGoalsMax>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listGoals: vi.fn<ListGoals>(),
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
  enforceGoalsMax: mocks.enforceGoalsMax,
}));

vi.mock("@/lib/features/goals", async () => {
  const actual = await vi.importActual<typeof goalSchemas>(
    "@/lib/features/goals/schemas",
  );

  return {
    createGoal: mocks.createGoal,
    createGoalSchema: actual.createGoalSchema,
    listGoals: mocks.listGoals,
  };
});

import { GET, POST } from "@/app/api/goals/route";

const goalRecord: GoalRecord = {
  id: "goal-1",
  title: "Launch v2",
  description: "Ship the next major release.",
  status: "in_progress",
  targetDate: "2026-06-01T00:00:00.000Z",
  meetingId: null,
  milestones: [],
  tasks: [],
  labels: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

describe("/api/goals route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listGoals.mockResolvedValue([goalRecord]);
    mocks.createGoal.mockResolvedValue(goalRecord);
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceGoalsMax.mockResolvedValue({ allowed: true });
  });

  it("lists authenticated user goals with a validated status filter", async () => {
    const response = await GET(
      new Request("http://localhost/api/goals?status=in_progress"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ goals: [goalRecord] });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listGoals).toHaveBeenCalledWith("user-1", {
      status: "in_progress",
    });
  });

  it("creates a goal through auth, rate-limit, tier, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/goals", {
        body: JSON.stringify({
          title: "Launch v2",
          status: "in_progress",
          targetDate: "2026-06-01",
          milestones: [{ title: "Backend ready" }],
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ goal: goalRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs =
      mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceGoalsMax).toHaveBeenCalledWith("user-1");
    expect(mocks.createGoal).toHaveBeenCalledWith("user-1", {
      title: "Launch v2",
      status: "in_progress",
      targetDate: "2026-06-01T00:00:00Z",
      milestones: [{ title: "Backend ready" }],
    });
  });

  it("returns 400 for invalid create input", async () => {
    const response = await POST(
      new Request("http://localhost/api/goals", {
        body: JSON.stringify({ title: "", status: "blocked" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createGoal).not.toHaveBeenCalled();
  });
});
