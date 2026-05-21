import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalRecord } from "@/types/api";
import type { UpdateGoalInput } from "@/lib/features/goals/schemas";
import type * as goalSchemas from "@/lib/features/goals/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type UpdateGoal = (
  goalId: string,
  userId: string,
  input: UpdateGoalInput,
) => Promise<
  | { ok: true; goal: GoalRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }
>;
type DeleteGoal = (
  goalId: string,
  userId: string,
) => Promise<{ ok: boolean }>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;

const mocks = vi.hoisted(() => ({
  deleteGoal: vi.fn<DeleteGoal>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateGoal: vi.fn<UpdateGoal>(),
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

vi.mock("@/lib/features/goals", async () => {
  const actual = await vi.importActual<typeof goalSchemas>(
    "@/lib/features/goals/schemas",
  );

  return {
    deleteGoal: mocks.deleteGoal,
    updateGoal: mocks.updateGoal,
    updateGoalSchema: actual.updateGoalSchema,
  };
});

import { DELETE, PATCH } from "@/app/api/goals/[id]/route";

const goalRecord: GoalRecord = {
  id: "goal-1",
  title: "Launch v2",
  description: null,
  status: "done",
  targetDate: "2026-06-01T00:00:00.000Z",
  meetingId: null,
  milestones: [],
  tasks: [],
  labels: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "goal-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/goals/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateGoal.mockResolvedValue({ ok: true, goal: goalRecord });
    mocks.deleteGoal.mockResolvedValue({ ok: true });
  });

  it("patches a goal through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/goals/goal-1", {
        body: JSON.stringify({
          status: "done",
          targetDate: "2026-06-01",
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
    await expect(response.json()).resolves.toEqual({ goal: goalRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateGoal).toHaveBeenCalledWith("goal-1", "user-1", {
      status: "done",
      targetDate: "2026-06-01T00:00:00Z",
    });
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/goals/goal-1", {
        body: JSON.stringify({ status: "blocked" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateGoal).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned goal", async () => {
    mocks.updateGoal.mockResolvedValue({ ok: false, notFound: true });

    const response = await PATCH(
      new Request("http://localhost/api/goals/goal-1", {
        body: JSON.stringify({ title: "Launch v2" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Goal not found" });
  });

  it("deletes a goal through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteGoal).toHaveBeenCalledWith("goal-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned goal", async () => {
    mocks.deleteGoal.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Goal not found" });
  });
});
