import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MilestoneRecord } from "@/types/api";
import type { UpdateMilestoneInput } from "@/lib/features/goals/schemas";
import type * as goalSchemas from "@/lib/features/goals/schemas";

type UpdateMilestone = (
  milestoneId: string,
  goalId: string,
  userId: string,
  input: UpdateMilestoneInput,
) => Promise<MilestoneRecord | null>;
type DeleteMilestone = (
  milestoneId: string,
  goalId: string,
  userId: string,
) => Promise<{ ok: boolean }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  deleteMilestone: vi.fn<DeleteMilestone>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateMilestone: vi.fn<UpdateMilestone>(),
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
    deleteMilestone: mocks.deleteMilestone,
    updateMilestone: mocks.updateMilestone,
    updateMilestoneSchema: actual.updateMilestoneSchema,
  };
});

import {
  DELETE,
  PATCH,
} from "@/app/api/goals/[id]/milestones/[milestoneId]/route";

const milestoneRecord: MilestoneRecord = {
  id: "milestone-1",
  title: "Backend ready",
  completed: true,
  position: 1,
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "goal-1", milestoneId = "milestone-1") {
  return { params: Promise.resolve({ id, milestoneId }) };
}

describe("/api/goals/[id]/milestones/[milestoneId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateMilestone.mockResolvedValue(milestoneRecord);
    mocks.deleteMilestone.mockResolvedValue({ ok: true });
  });

  it("patches a milestone through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/goals/goal-1/milestones/milestone-1", {
        body: JSON.stringify({
          completed: true,
          position: 1,
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
      milestone: milestoneRecord,
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateMilestone).toHaveBeenCalledWith(
      "milestone-1",
      "goal-1",
      "user-1",
      {
        completed: true,
        position: 1,
      },
    );
  });

  it("returns 400 for invalid patch milestone input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/goals/goal-1/milestones/milestone-1", {
        body: JSON.stringify({ position: -1 }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateMilestone).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned milestone", async () => {
    mocks.updateMilestone.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/goals/goal-1/milestones/milestone-1", {
        body: JSON.stringify({ completed: true }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Milestone not found",
    });
  });

  it("deletes a milestone through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1/milestones/milestone-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteMilestone).toHaveBeenCalledWith(
      "milestone-1",
      "goal-1",
      "user-1",
    );
  });

  it("returns 404 when deleting a missing or unowned milestone", async () => {
    mocks.deleteMilestone.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/goals/goal-1/milestones/milestone-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Milestone not found",
    });
  });
});
