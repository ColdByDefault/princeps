import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RunWeeklyDigestNudges = () => Promise<{
  usersScanned: number;
  eligibleUsers: number;
  skippedTier: number;
  skippedNotifications: number;
  skippedCooldown: number;
  noActivity: number;
  created: number;
  failed: number;
}>;

const mocks = vi.hoisted(() => ({
  runWeeklyDigestNudges: vi.fn<RunWeeklyDigestNudges>(),
}));

vi.mock("@/lib/features/notifications", () => ({
  runWeeklyDigestNudges: mocks.runWeeklyDigestNudges,
}));

import { POST } from "@/app/api/cron/digest/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("/api/cron/digest route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    mocks.runWeeklyDigestNudges.mockResolvedValue({
      usersScanned: 3,
      eligibleUsers: 2,
      skippedTier: 1,
      skippedNotifications: 0,
      skippedCooldown: 0,
      noActivity: 1,
      created: 1,
      failed: 0,
    });
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
      new Request("http://localhost/api/cron/digest", { method: "POST" }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET not configured.",
    });
    expect(mocks.runWeeklyDigestNudges).not.toHaveBeenCalled();
  });

  it("rejects unauthorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/digest", {
        headers: { authorization: "Bearer wrong" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.runWeeklyDigestNudges).not.toHaveBeenCalled();
  });

  it("runs weekly digest nudges for authorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/digest", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Weekly digest nudges created: 1.",
      usersScanned: 3,
      eligibleUsers: 2,
      skippedTier: 1,
      skippedNotifications: 0,
      skippedCooldown: 0,
      noActivity: 1,
      created: 1,
      failed: 0,
    });
    expect(mocks.runWeeklyDigestNudges).toHaveBeenCalledTimes(1);
  });
});
