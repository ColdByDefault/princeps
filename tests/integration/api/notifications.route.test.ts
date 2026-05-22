import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationRecord } from "@/types/api";

type ListNotifications = (userId: string) => Promise<NotificationRecord[]>;
type DeleteAllNotifications = (userId: string) => Promise<{ count: number }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  deleteAllNotifications: vi.fn<DeleteAllNotifications>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listNotifications: vi.fn<ListNotifications>(),
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
  deleteAllNotifications: mocks.deleteAllNotifications,
  listNotifications: mocks.listNotifications,
}));

import { DELETE, GET } from "@/app/api/notifications/route";

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

describe("/api/notifications route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listNotifications.mockResolvedValue([notificationRecord]);
    mocks.deleteAllNotifications.mockResolvedValue({ count: 1 });
  });

  it("lists authenticated user notifications", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notifications: [notificationRecord],
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listNotifications).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 when listing without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.listNotifications).not.toHaveBeenCalled();
  });

  it("soft-deletes all user notifications", async () => {
    const response = await DELETE();

    expect(response.status).toBe(204);
    expect(mocks.deleteAllNotifications).toHaveBeenCalledWith("user-1");
  });
});
