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

const mocks = vi.hoisted(() => ({
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

import { POST } from "@/app/api/cron/weekly-review/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("/api/cron/weekly-review route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";

    const tiersByUserId: Record<string, string> = {
      "user-ok": "pro",
      "user-failed": "premium",
      "unexpected-free": "free",
    };

    mocks.userFindMany.mockResolvedValue([
      { id: "user-ok", tier: "pro" },
      { id: "user-failed", tier: "premium" },
      { id: "unexpected-free", tier: "free" },
    ]);
    mocks.userFindUniqueOrThrow.mockImplementation(async ({ where }) => {
      const tier = tiersByUserId[where.id];
      if (!tier) {
        throw new Error(`User not found: ${where.id}`);
      }
      return { tier, preferences: {} };
    });
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
      new Request("http://localhost/api/cron/weekly-review", {
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
      new Request("http://localhost/api/cron/weekly-review", {
        headers: { authorization: "Bearer wrong" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("runs weekly review for pro tiers and reports ok, skipped, and failed counts", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/weekly-review", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Weekly review: 1 ok, 1 skipped, 1 failed.",
      ok: 1,
      skipped: 1,
      failed: 1,
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: { tier: { in: ["pro", "premium", "enterprise"] } },
      select: { id: true, tier: true },
    });
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
    expect(mocks.runAgent).toHaveBeenCalledWith("weekly-review", {
      userId: "user-ok",
      userMessage: "Run my weekly review.",
    });
    expect(mocks.runAgent).toHaveBeenCalledWith("weekly-review", {
      userId: "user-failed",
      userMessage: "Run my weekly review.",
    });
    expect(mocks.runAgent).not.toHaveBeenCalledWith(
      "weekly-review",
      expect.objectContaining({ userId: "unexpected-free" }),
    );
  });
});
