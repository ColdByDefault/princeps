import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MeetingCandidate = {
  id: string;
  scheduledAt: Date;
  durationMin: number | null;
};

type MeetingFindManyArgs = {
  where: { status: "upcoming" };
  select: { id: true; scheduledAt: true; durationMin: true };
};

type MeetingUpdateManyArgs = {
  where: { id: { in: string[] } };
  data: { status: "done" };
};

const mocks = vi.hoisted(() => ({
  meetingFindMany: vi.fn<
    (args: MeetingFindManyArgs) => Promise<MeetingCandidate[]>
  >(),
  meetingUpdateMany: vi.fn<
    (args: MeetingUpdateManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    meeting: {
      findMany: mocks.meetingFindMany,
      updateMany: mocks.meetingUpdateMany,
    },
  },
}));

import { POST } from "@/app/api/cron/meeting-followup/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("/api/cron/meeting-followup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));
    process.env.CRON_SECRET = "cron-secret";
    mocks.meetingFindMany.mockResolvedValue([]);
    mocks.meetingUpdateMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  it("rejects requests when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await POST(
      new Request("http://localhost/api/cron/meeting-followup", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET not configured.",
    });
    expect(mocks.meetingFindMany).not.toHaveBeenCalled();
  });

  it("rejects unauthorized cron requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/cron/meeting-followup", {
        headers: { authorization: "Bearer wrong" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.meetingFindMany).not.toHaveBeenCalled();
  });

  it("returns zero updates when no upcoming meetings have ended", async () => {
    mocks.meetingFindMany.mockResolvedValue([
      {
        id: "still-running",
        scheduledAt: new Date("2026-05-22T11:30:00.000Z"),
        durationMin: 60,
      },
      {
        id: "future-meeting",
        scheduledAt: new Date("2026-05-22T13:00:00.000Z"),
        durationMin: null,
      },
    ]);

    const response = await POST(
      new Request("http://localhost/api/cron/meeting-followup", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ updated: 0 });
    expect(mocks.meetingFindMany).toHaveBeenCalledWith({
      where: { status: "upcoming" },
      select: { id: true, scheduledAt: true, durationMin: true },
    });
    expect(mocks.meetingUpdateMany).not.toHaveBeenCalled();
  });

  it("marks upcoming meetings done when their scheduled end time has passed", async () => {
    mocks.meetingFindMany.mockResolvedValue([
      {
        id: "ended-without-duration",
        scheduledAt: new Date("2026-05-22T11:00:00.000Z"),
        durationMin: null,
      },
      {
        id: "still-running",
        scheduledAt: new Date("2026-05-22T11:30:00.000Z"),
        durationMin: 60,
      },
      {
        id: "ended-with-duration",
        scheduledAt: new Date("2026-05-22T10:00:00.000Z"),
        durationMin: 90,
      },
      {
        id: "future-meeting",
        scheduledAt: new Date("2026-05-22T13:00:00.000Z"),
        durationMin: null,
      },
    ]);
    mocks.meetingUpdateMany.mockResolvedValue({ count: 2 });

    const response = await POST(
      new Request("http://localhost/api/cron/meeting-followup", {
        headers: { authorization: "Bearer cron-secret" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ updated: 2 });
    expect(mocks.meetingUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["ended-without-duration", "ended-with-duration"] },
      },
      data: { status: "done" },
    });
  });
});
