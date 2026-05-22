import { afterEach, describe, expect, it, vi } from "vitest";
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
  where: { userId: string; category: "daily_greeting" };
  select: unknown;
  orderBy: { createdAt: "desc" };
  take: 10;
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

import {
  findTodayGreeting,
  todayUtc,
  toNotificationRecord,
} from "@/lib/features/notifications/shared.logic";

const createdAt = new Date("2026-05-22T06:00:00.000Z");

function makeNotificationRow(
  overrides: Partial<DbNotificationRow> = {},
): DbNotificationRow {
  return {
    id: "notification-1",
    userId: "user-1",
    category: "daily_greeting",
    source: "assistant",
    title: "Good morning",
    body: "A concise greeting.",
    read: false,
    dismissed: false,
    metadata: { date: "2026-05-22" },
    createdAt,
    ...overrides,
  };
}

describe("notification shared logic", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps notification rows to client-safe records", () => {
    const record = toNotificationRecord(makeNotificationRow());

    const expectedRecord: NotificationRecord = {
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
    expect(record).toEqual(expectedRecord);
  });

  it("returns today's UTC date string", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T23:30:00.000Z"));

    expect(todayUtc()).toBe("2026-05-22");
  });

  it("finds an existing greeting with today's metadata date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));
    const yesterday = makeNotificationRow({
      id: "notification-yesterday",
      metadata: { date: "2026-05-21" },
    });
    const today = makeNotificationRow({ id: "notification-today" });
    mocks.notificationFindMany.mockResolvedValue([yesterday, today]);

    const result = await findTodayGreeting("user-1");

    expect(mocks.notificationFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1", category: "daily_greeting" },
      select: expect.objectContaining({ id: true, title: true }),
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    expect(result?.id).toBe("notification-today");
  });
});
