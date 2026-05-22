import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationRecord } from "@/types/api";

type DbNotificationRow = {
  id: string;
  userId: string;
  category: string;
  source: string;
  title: string;
  body: string;
  read: boolean;
  dismissed: boolean;
  metadata: unknown;
  createdAt: Date;
};

type NotificationFindFirstArgs = {
  where: { id: string; userId: string };
};

type NotificationUpdateArgs = {
  where: { id: string };
  data: { read: true };
  select: unknown;
};

type NotificationUpdateManyArgs = {
  where: { userId: string; dismissed: false; read: false };
  data: { read: true };
};

const mocks = vi.hoisted(() => ({
  notificationFindFirst: vi.fn<
    (args: NotificationFindFirstArgs) => Promise<{ id: string } | null>
  >(),
  notificationUpdate: vi.fn<
    (args: NotificationUpdateArgs) => Promise<DbNotificationRow>
  >(),
  notificationUpdateMany: vi.fn<
    (args: NotificationUpdateManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    notification: {
      findFirst: mocks.notificationFindFirst,
      update: mocks.notificationUpdate,
      updateMany: mocks.notificationUpdateMany,
    },
  },
}));

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/features/notifications/mark-read.logic";

describe("notification mark-read logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks a user-owned notification as read", async () => {
    mocks.notificationFindFirst.mockResolvedValue({ id: "notification-1" });
    mocks.notificationUpdate.mockResolvedValue({
      id: "notification-1",
      userId: "user-1",
      category: "daily_greeting",
      source: "assistant",
      title: "Good morning",
      body: "A concise greeting.",
      read: true,
      dismissed: false,
      metadata: { date: "2026-05-22" },
      createdAt: new Date("2026-05-22T06:00:00.000Z"),
    });

    const record = await markNotificationRead("user-1", "notification-1");

    expect(mocks.notificationFindFirst).toHaveBeenCalledWith({
      where: { id: "notification-1", userId: "user-1" },
    });
    expect(mocks.notificationUpdate).toHaveBeenCalledWith({
      where: { id: "notification-1" },
      data: { read: true },
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecord: NotificationRecord = {
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
    expect(record).toEqual(expectedRecord);
  });

  it("returns null when marking a missing or unowned notification", async () => {
    mocks.notificationFindFirst.mockResolvedValue(null);

    const record = await markNotificationRead("user-1", "notification-1");

    expect(record).toBeNull();
    expect(mocks.notificationUpdate).not.toHaveBeenCalled();
  });

  it("marks all unread non-dismissed notifications as read", async () => {
    mocks.notificationUpdateMany.mockResolvedValue({ count: 3 });

    const result = await markAllNotificationsRead("user-1");

    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", dismissed: false, read: false },
      data: { read: true },
    });
    expect(result).toEqual({ count: 3 });
  });
});
