import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RunOverdueTaskNudges = () => Promise<{
  usersScanned: number;
  eligibleUsers: number;
  skippedTier: number;
  skippedNotifications: number;
  skippedUserPreference: number;
  skippedCooldown: number;
  withoutOverdueTasks: number;
  created: number;
  failed: number;
}>;

const mocks = vi.hoisted(() => ({
  runOverdueTaskNudges: vi.fn<RunOverdueTaskNudges>(),
}));

vi.mock("@/lib/features/notifications", () => ({
  runOverdueTaskNudges: mocks.runOverdueTaskNudges,
}));

import { POST } from "@/app/api/cron/tasks-overdue/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("/api/cron/tasks-overdue route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    mocks.runOverdueTaskNudges.mockResolvedValue({
      usersScanned: 2,
      eligibleUsers: 1,
      skippedTier: 1,
      skippedNotifications: 0,
      skippedUserPreference: 0,
      skippedCooldown: 0,
      withoutOverdueTasks: 0,
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
      new Request("http://localhost/api/cron/tasks-overdue", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET not configured.",
    });
    expect(mocks.runOverdueTaskNudges).not.toHaveBeenCalled();
  });

  it("rejects unauthorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/tasks-overdue", {
        headers: { authorization: "Bearer wrong" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.runOverdueTaskNudges).not.toHaveBeenCalled();
  });

  it("runs overdue task nudges for authorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/tasks-overdue", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Overdue task nudges created: 1.",
      usersScanned: 2,
      eligibleUsers: 1,
      skippedTier: 1,
      skippedNotifications: 0,
      skippedUserPreference: 0,
      skippedCooldown: 0,
      withoutOverdueTasks: 0,
      created: 1,
      failed: 0,
    });
    expect(mocks.runOverdueTaskNudges).toHaveBeenCalledTimes(1);
  });
});
