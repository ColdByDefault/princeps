import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationRecord } from "@/types/api";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type GenerateDailyGreeting = (
  userId: string,
) => Promise<{ created: boolean; notification: NotificationRecord | null }>;

const mocks = vi.hoisted(() => ({
  generateDailyGreeting: vi.fn<GenerateDailyGreeting>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
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

vi.mock("@/lib/features/notifications", () => ({
  generateDailyGreeting: mocks.generateDailyGreeting,
}));

import { POST } from "@/app/api/notifications/greeting/route";

const notificationRecord: NotificationRecord = {
  id: "notification-1",
  userId: "user-1",
  category: "daily_greeting",
  source: "assistant",
  title: "Good morning",
  body: "A concise greeting.",
  read: false,
  dismissed: false,
  metadata: { date: "2026-05-22" },
  createdAt: "2026-05-22T06:00:00.000Z",
};

describe("/api/notifications/greeting route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.generateDailyGreeting.mockResolvedValue({
      created: true,
      notification: notificationRecord,
    });
  });

  it("generates a daily greeting for the authenticated user", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      created: true,
      notification: notificationRecord,
    });
    expect(mocks.generateDailyGreeting).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.generateDailyGreeting).not.toHaveBeenCalled();
  });
});
