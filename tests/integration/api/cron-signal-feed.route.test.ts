import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type UserRow = {
  id: string;
  tier: string;
};

type UserFindManyArgs = {
  where: { tier: { in: string[] } };
  select: { id: true; tier: true };
};

type UserFindUniqueOrThrowArgs = {
  where: { id: string };
  select: { tier: true; preferences: true };
};

type UserToolGateRow = {
  tier: string;
  preferences: unknown;
};

type RunAgentInput = {
  userId: string;
  userMessage: string;
};

type UserPreferences = {
  signalTopics: string[];
};

const mocks = vi.hoisted(() => ({
  getUserPreferences: vi.fn<(userId: string) => Promise<UserPreferences>>(),
  runAgent:
    vi.fn<
      (agentName: string, input: RunAgentInput) => Promise<{ ok: boolean }>
    >(),
  userFindMany: vi.fn<(args: UserFindManyArgs) => Promise<UserRow[]>>(),
  userFindUniqueOrThrow:
    vi.fn<(args: UserFindUniqueOrThrowArgs) => Promise<UserToolGateRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    user: {
      findMany: mocks.userFindMany,
      findUniqueOrThrow: mocks.userFindUniqueOrThrow,
    },
  },
}));

vi.mock("@/lib/ai/agents/registry", () => ({
  runAgent: mocks.runAgent,
}));

vi.mock("@/lib/platform/settings/user-preferences.logic", () => ({
  getUserPreferences: mocks.getUserPreferences,
}));

import { POST } from "@/app/api/cron/signal-feed/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("/api/cron/signal-feed route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";

    const tiersByUserId: Record<string, string> = {
      "no-topics": "pro",
      "user-ok": "premium",
      "user-failed": "enterprise",
      "unexpected-free": "free",
    };

    mocks.userFindMany.mockResolvedValue([
      { id: "no-topics", tier: "pro" },
      { id: "user-ok", tier: "premium" },
      { id: "user-failed", tier: "enterprise" },
      { id: "unexpected-free", tier: "free" },
    ]);
    mocks.userFindUniqueOrThrow.mockImplementation(async ({ where }) => {
      const tier = tiersByUserId[where.id];
      if (!tier) {
        throw new Error(`User not found: ${where.id}`);
      }
      return { tier, preferences: {} };
    });
    mocks.getUserPreferences.mockImplementation(async (userId) => ({
      signalTopics:
        userId === "no-topics" ? [] : ["AI regulation", "energy markets"],
    }));
    mocks.runAgent.mockImplementation(async (_agentName, input) => ({
      ok: input.userId === "user-ok",
    }));
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  it("rejects requests when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await POST(
      new Request("http://localhost/api/cron/signal-feed", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET not configured.",
    });
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("rejects unauthorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/signal-feed", {
        headers: { authorization: "Bearer wrong" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("runs signal feed only for pro-tier users with configured topics", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/signal-feed", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message:
        "Signal feed: 1 ok, 2 skipped (no topics or wrong tier), 1 failed.",
      ok: 1,
      skipped: 2,
      failed: 1,
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: { tier: { in: ["pro", "premium", "enterprise"] } },
      select: { id: true, tier: true },
    });
    expect(mocks.getUserPreferences).toHaveBeenCalledWith("no-topics");
    expect(mocks.getUserPreferences).toHaveBeenCalledWith("user-ok");
    expect(mocks.getUserPreferences).toHaveBeenCalledWith("user-failed");
    expect(mocks.getUserPreferences).not.toHaveBeenCalledWith(
      "unexpected-free",
    );
    expect(mocks.runAgent).toHaveBeenCalledTimes(2);
    expect(mocks.userFindUniqueOrThrow).toHaveBeenCalledTimes(2);
    expect(mocks.userFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "user-ok" },
      select: { tier: true, preferences: true },
    });
    expect(mocks.userFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "user-failed" },
      select: { tier: true, preferences: true },
    });
    expect(mocks.runAgent).toHaveBeenCalledWith("signal-feed", {
      userId: "user-ok",
      userMessage:
        "Produce a signal-feed digest on: AI regulation, energy markets",
    });
    expect(mocks.runAgent).toHaveBeenCalledWith("signal-feed", {
      userId: "user-failed",
      userMessage:
        "Produce a signal-feed digest on: AI regulation, energy markets",
    });
  });
});
