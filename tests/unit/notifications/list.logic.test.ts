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

type NotificationFindManyArgs = {
  where: { userId: string; dismissed: false };
  orderBy: { createdAt: "desc" };
  take: 50;
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  notificationFindMany: vi.fn<
    (args: NotificationFindManyArgs) => Promise<DbNotificationRow[]>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    notification: {
      findMany: mocks.notificationFindMany,
    },
  },
}));

import { listNotifications } from "@/lib/features/notifications/list.logic";

describe("listNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists non-dismissed user notifications newest first", async () => {
    mocks.notificationFindMany.mockResolvedValue([
      {
        id: "notification-1",
        userId: "user-1",
        category: "daily_greeting",
        source: "assistant",
        title: "Good morning",
        body: "A concise greeting.",
        read: false,
        dismissed: false,
        metadata: { date: "2026-05-22" },
        createdAt: new Date("2026-05-22T06:00:00.000Z"),
      },
    ]);

    const records = await listNotifications("user-1");

    expect(mocks.notificationFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1", dismissed: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecords: NotificationRecord[] = [
      {
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
      },
    ];
    expect(records).toEqual(expectedRecords);
  });
});
