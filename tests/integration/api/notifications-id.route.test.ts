import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationRecord } from "@/types/api";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";

type MarkNotificationRead = (
  userId: string,
  notificationId: string,
) => Promise<NotificationRecord | null>;
type DeleteNotification = (
  userId: string,
  notificationId: string,
) => Promise<{ ok: boolean }>;

const mocks = vi.hoisted(() => ({
  deleteNotification: vi.fn<DeleteNotification>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  markNotificationRead: vi.fn<MarkNotificationRead>(),
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
  deleteNotification: mocks.deleteNotification,
  markNotificationRead: mocks.markNotificationRead,
}));

import { DELETE, PATCH } from "@/app/api/notifications/[id]/route";

const notificationRecord: NotificationRecord = {
  id: "notification-1",
  userId: "user-1",
  category: "daily_greeting",
  source: "assistant",
  title: "Good morning",
  body: "A concise greeting.",
  read: true,
  dismissed: false,
  metadata: { date: "2026-05-22" },
  createdAt: "2026-05-22T06:00:00.000Z",
};

function params(id = "notification-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/notifications/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.markNotificationRead.mockResolvedValue(notificationRecord);
    mocks.deleteNotification.mockResolvedValue({ ok: true });
  });

  it("marks a notification as read for the authenticated user", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/notifications/notification-1", {
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      notification: notificationRecord,
    });
    expect(mocks.markNotificationRead).toHaveBeenCalledWith(
      "user-1",
      "notification-1",
    );
  });

  it("returns 404 when marking a missing or unowned notification", async () => {
    mocks.markNotificationRead.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/notifications/notification-1", {
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Notification not found",
    });
  });

  it("soft-deletes a notification for the authenticated user", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/notifications/notification-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.deleteNotification).toHaveBeenCalledWith(
      "user-1",
      "notification-1",
    );
  });

  it("returns 404 when deleting a missing or unowned notification", async () => {
    mocks.deleteNotification.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/notifications/notification-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Notification not found",
    });
  });
});
