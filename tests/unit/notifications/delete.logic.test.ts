import { beforeEach, describe, expect, it, vi } from "vitest";

type NotificationUpdateManyArgs = {
  where: {
    id?: string;
    userId: string;
    dismissed: false;
  };
  data: { dismissed: true };
};

const mocks = vi.hoisted(() => ({
  notificationUpdateMany: vi.fn<
    (args: NotificationUpdateManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    notification: {
      updateMany: mocks.notificationUpdateMany,
    },
  },
}));

import {
  deleteAllNotifications,
  deleteNotification,
} from "@/lib/features/notifications/delete.logic";

describe("notification delete logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft-deletes one user-owned notification", async () => {
    mocks.notificationUpdateMany.mockResolvedValue({ count: 1 });

    const result = await deleteNotification("user-1", "notification-1");

    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({
      where: { id: "notification-1", userId: "user-1", dismissed: false },
      data: { dismissed: true },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no notification is soft-deleted", async () => {
    mocks.notificationUpdateMany.mockResolvedValue({ count: 0 });

    const result = await deleteNotification("user-1", "notification-1");

    expect(result).toEqual({ ok: false });
  });

  it("soft-deletes all non-dismissed notifications for the user", async () => {
    mocks.notificationUpdateMany.mockResolvedValue({ count: 5 });

    const result = await deleteAllNotifications("user-1");

    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", dismissed: false },
      data: { dismissed: true },
    });
    expect(result).toEqual({ count: 5 });
  });
});
