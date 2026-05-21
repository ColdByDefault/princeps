import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionRecord } from "@/types/api";
import type { UpdateDecisionInput } from "@/lib/decisions/schemas";
import type * as decisionSchemas from "@/lib/decisions/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type UpdateDecision = (
  decisionId: string,
  userId: string,
  input: UpdateDecisionInput,
) => Promise<
  | { ok: true; decision: DecisionRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }
>;
type DeleteDecision = (
  decisionId: string,
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
  deleteDecision: vi.fn<DeleteDecision>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateDecision: vi.fn<UpdateDecision>(),
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

vi.mock("@/lib/decisions", async () => {
  const actual = await vi.importActual<typeof decisionSchemas>(
    "@/lib/decisions/schemas",
  );

  return {
    deleteDecision: mocks.deleteDecision,
    updateDecision: mocks.updateDecision,
    updateDecisionSchema: actual.updateDecisionSchema,
  };
});

import { DELETE, PATCH } from "@/app/api/decisions/[id]/route";

const decisionRecord: DecisionRecord = {
  id: "decision-1",
  title: "Adopt new reporting cadence",
  rationale: "The team needs a tighter executive loop.",
  outcome: "Move to weekly reporting.",
  status: "decided",
  decidedAt: "2026-06-01T08:00:00.000Z",
  meetingId: null,
  meetingTitle: null,
  labels: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "decision-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/decisions/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateDecision.mockResolvedValue({
      ok: true,
      decision: decisionRecord,
    });
    mocks.deleteDecision.mockResolvedValue({ ok: true });
  });

  it("patches a decision through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/decisions/decision-1", {
        body: JSON.stringify({
          status: "reversed",
          decidedAt: "2026-06-01",
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
      decision: decisionRecord,
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateDecision).toHaveBeenCalledWith(
      "decision-1",
      "user-1",
      {
        status: "reversed",
        decidedAt: "2026-06-01T00:00:00Z",
      },
    );
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/decisions/decision-1", {
        body: JSON.stringify({ status: "blocked" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateDecision).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned decision", async () => {
    mocks.updateDecision.mockResolvedValue({ ok: false, notFound: true });

    const response = await PATCH(
      new Request("http://localhost/api/decisions/decision-1", {
        body: JSON.stringify({ title: "Adopt new reporting cadence" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Decision not found",
    });
  });

  it("deletes a decision through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/decisions/decision-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteDecision).toHaveBeenCalledWith("decision-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned decision", async () => {
    mocks.deleteDecision.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/decisions/decision-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Decision not found",
    });
  });
});
