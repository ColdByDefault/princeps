import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionRecord } from "@/types/api";
import type { CreateDecisionInput } from "@/lib/features/decisions/schemas";
import type * as decisionSchemas from "@/lib/features/decisions/schemas";

type DecisionStatus = "open" | "decided" | "reversed";
type ListDecisions = (
  userId: string,
  filter?: { status?: DecisionStatus },
) => Promise<DecisionRecord[]>;
type CreateDecision = (
  userId: string,
  input: CreateDecisionInput,
) => Promise<DecisionRecord>;
type EnforceDecisionsMax = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  createDecision: vi.fn<CreateDecision>(),
  enforceDecisionsMax: vi.fn<EnforceDecisionsMax>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listDecisions: vi.fn<ListDecisions>(),
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
  enforceDecisionsMax: mocks.enforceDecisionsMax,
}));

vi.mock("@/lib/features/decisions", async () => {
  const actual = await vi.importActual<typeof decisionSchemas>(
    "@/lib/features/decisions/schemas",
  );

  return {
    createDecision: mocks.createDecision,
    createDecisionSchema: actual.createDecisionSchema,
    listDecisions: mocks.listDecisions,
  };
});

import { GET, POST } from "@/app/api/decisions/route";

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

describe("/api/decisions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listDecisions.mockResolvedValue([decisionRecord]);
    mocks.createDecision.mockResolvedValue(decisionRecord);
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceDecisionsMax.mockResolvedValue({ allowed: true });
  });

  it("lists authenticated user decisions with a validated status filter", async () => {
    const response = await GET(
      new Request("http://localhost/api/decisions?status=decided"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      decisions: [decisionRecord],
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listDecisions).toHaveBeenCalledWith("user-1", {
      status: "decided",
    });
  });

  it("creates a decision through auth, rate-limit, tier, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/decisions", {
        body: JSON.stringify({
          title: "Adopt new reporting cadence",
          rationale: "The team needs a tighter executive loop.",
          outcome: "Move to weekly reporting.",
          status: "decided",
          decidedAt: "2026-06-01",
          labelIds: ["label-1"],
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
      decision: decisionRecord,
    });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs =
      mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceDecisionsMax).toHaveBeenCalledWith("user-1");
    expect(mocks.createDecision).toHaveBeenCalledWith("user-1", {
      title: "Adopt new reporting cadence",
      rationale: "The team needs a tighter executive loop.",
      outcome: "Move to weekly reporting.",
      status: "decided",
      decidedAt: "2026-06-01T00:00:00Z",
      labelIds: ["label-1"],
    });
  });

  it("returns 400 for invalid create input", async () => {
    const response = await POST(
      new Request("http://localhost/api/decisions", {
        body: JSON.stringify({ title: "", status: "blocked" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createDecision).not.toHaveBeenCalled();
  });
});
