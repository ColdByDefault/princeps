import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type UserFindManyArgs = {
  select: { id: true };
};

const mocks = vi.hoisted(() => ({
  generateBriefing: vi.fn<
    (userId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  >(),
  getUserPreferences: vi.fn<
    (userId: string) => Promise<{ autoBriefingEnabled: boolean | null }>
  >(),
  userFindMany: vi.fn<
    (args: UserFindManyArgs) => Promise<{ id: string }[]>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

vi.mock("@/lib/features/briefings", () => ({
  generateBriefing: mocks.generateBriefing,
}));

vi.mock("@/lib/platform/settings/user-preferences.logic", () => ({
  getUserPreferences: mocks.getUserPreferences,
}));

import { POST } from "@/app/api/cron/briefing/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("/api/cron/briefing route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    mocks.userFindMany.mockResolvedValue([
      { id: "user-ok" },
      { id: "user-disabled" },
      { id: "user-failed" },
    ]);
    mocks.getUserPreferences.mockImplementation(async (userId) => ({
      autoBriefingEnabled: userId === "user-disabled" ? false : null,
    }));
    mocks.generateBriefing.mockImplementation(async (userId) =>
      userId === "user-failed"
        ? { ok: false, error: "LLM call failed." }
        : { ok: true },
    );
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
      new Request("http://localhost/api/cron/briefing", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET not configured.",
    });
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("rejects unauthorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/briefing", {
        headers: { authorization: "Bearer wrong" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("regenerates briefings for users who have not opted out", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/briefing", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Briefings regenerated: 1 ok, 1 failed.",
      ok: 1,
      failed: 1,
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({ select: { id: true } });
    expect(mocks.getUserPreferences).toHaveBeenCalledTimes(3);
    expect(mocks.generateBriefing).toHaveBeenCalledWith("user-ok");
    expect(mocks.generateBriefing).not.toHaveBeenCalledWith("user-disabled");
    expect(mocks.generateBriefing).toHaveBeenCalledWith("user-failed");
  });
});
