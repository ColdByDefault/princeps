import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

type UserFindUniqueArgs = {
  where: { id: string };
  select: { name: true; timezone: true; preferences: true };
};

type NotificationFindManyArgs = {
  where: { userId: string; category: "daily_greeting" };
  select: unknown;
  orderBy: { createdAt: "desc" };
  take: 10;
};

type NotificationCreateArgs = {
  data: {
    userId: string;
    category: string;
    source: string;
    title: string;
    body: string;
    metadata: Record<string, unknown>;
  };
  select: unknown;
};

const originalForceGreeting = process.env.FORCE_GREETING;

const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  callChat: vi.fn<() => Promise<{ content: string }>>(),
  fetchWeather: vi.fn<
    () => Promise<{
      location: string;
      conditionEmoji: string;
      conditionLabel: string;
      temperatureCelsius: number;
      weatherCode: number;
    } | null>
  >(),
  listTasks: vi.fn<() => Promise<unknown[]>>(),
  notificationCreate: vi.fn<
    (args: NotificationCreateArgs) => Promise<DbNotificationRow>
  >(),
  notificationFindMany: vi.fn<
    (args: NotificationFindManyArgs) => Promise<DbNotificationRow[]>
  >(),
  userFindUnique: vi.fn<
    (args: UserFindUniqueArgs) => Promise<{
      name: string | null;
      timezone: string | null;
      preferences: unknown;
    } | null>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    notification: {
      create: mocks.notificationCreate,
      findMany: mocks.notificationFindMany,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/ai/llm-providers/provider", () => ({
  callChat: mocks.callChat,
}));

vi.mock("@/lib/services/weather/fetch", () => ({
  fetchWeather: mocks.fetchWeather,
}));

vi.mock("@/lib/features/tasks/list.logic", () => ({
  listTasks: mocks.listTasks,
}));

vi.mock("@/lib/platform/tiers/enforce", () => ({
  accumulateTokens: mocks.accumulateTokens,
}));

import { generateDailyGreeting } from "@/lib/features/notifications/greeting.logic";

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
    body: "Good morning, Yazan.",
    read: false,
    dismissed: false,
    metadata: { date: "2026-05-22" },
    createdAt,
    ...overrides,
  };
}

describe("generateDailyGreeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T09:00:00.000Z"));
    delete process.env.FORCE_GREETING;
    mocks.notificationFindMany.mockResolvedValue([]);
    mocks.userFindUnique.mockResolvedValue({
      name: "Yazan",
      timezone: "UTC",
      preferences: {
        language: "en",
        notificationsEnabled: true,
        location: "Paris",
        locationLat: 48.8566,
        locationLon: 2.3522,
      },
    });
    mocks.fetchWeather.mockResolvedValue({
      location: "Paris",
      conditionEmoji: "☀️",
      conditionLabel: "Sunny",
      temperatureCelsius: 22,
      weatherCode: 0,
    });
    mocks.listTasks.mockResolvedValueOnce([{ id: "task-open" }]);
    mocks.listTasks.mockResolvedValueOnce([{ id: "task-progress" }]);
    mocks.callChat.mockResolvedValue({ content: "  Good morning, Yazan.  " });
    mocks.accumulateTokens.mockResolvedValue();
    mocks.notificationCreate.mockResolvedValue(makeNotificationRow());
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalForceGreeting === undefined) {
      delete process.env.FORCE_GREETING;
    } else {
      process.env.FORCE_GREETING = originalForceGreeting;
    }
  });

  it("returns today's existing greeting without regenerating", async () => {
    const existing = makeNotificationRow({ id: "notification-existing" });
    mocks.notificationFindMany.mockResolvedValue([existing]);

    const result = await generateDailyGreeting("user-1");

    const expectedNotification: NotificationRecord = {
      id: "notification-existing",
      userId: "user-1",
      category: "daily_greeting",
      source: "assistant",
      title: "Good morning",
      body: "Good morning, Yazan.",
      read: false,
      dismissed: false,
      metadata: { date: "2026-05-22" },
      createdAt: "2026-05-22T06:00:00.000Z",
    };
    expect(result).toEqual({
      created: false,
      notification: expectedNotification,
    });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it("generates and stores a localized greeting with weather and task context", async () => {
    const result = await generateDailyGreeting("user-1");

    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { name: true, timezone: true, preferences: true },
    });
    expect(mocks.fetchWeather).toHaveBeenCalledWith("UTC", {
      label: "Paris",
      lat: 48.8566,
      lon: 2.3522,
    });
    expect(mocks.listTasks).toHaveBeenNthCalledWith(1, "user-1", {
      status: "open",
    });
    expect(mocks.listTasks).toHaveBeenNthCalledWith(2, "user-1", {
      status: "in_progress",
    });

    const callArgs = mocks.callChat.mock.calls[0]?.[0];
    expect(callArgs?.[0].content).toContain("Respond only in English.");
    expect(callArgs?.[1].content).toContain("Current weather in Paris");
    expect(callArgs?.[1].content).toContain("2 active tasks");
    expect(mocks.accumulateTokens).toHaveBeenCalledWith(
      "user-1",
      expect.any(Number),
      expect.any(Number),
    );
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        category: "daily_greeting",
        source: "assistant",
        title: "Good morning",
        body: "Good morning, Yazan.",
        metadata: {
          date: "2026-05-22",
          weather: {
            temp: 22,
            code: 0,
            label: "Sunny",
            emoji: "☀️",
            location: "Paris",
          },
        },
      },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(result).toMatchObject({
      created: true,
      notification: {
        id: "notification-1",
        body: "Good morning, Yazan.",
      },
    });
  });

  it("returns no notification when the user is missing or opted out", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);

    await expect(generateDailyGreeting("user-1")).resolves.toEqual({
      created: false,
      notification: null,
    });

    mocks.userFindUnique.mockResolvedValueOnce({
      name: "Yazan",
      timezone: "UTC",
      preferences: { notificationsEnabled: false },
    });

    await expect(generateDailyGreeting("user-1")).resolves.toEqual({
      created: false,
      notification: null,
    });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it("returns no notification when the LLM fails or returns empty content", async () => {
    mocks.callChat.mockRejectedValueOnce(new Error("llm unavailable"));

    await expect(generateDailyGreeting("user-1")).resolves.toEqual({
      created: false,
      notification: null,
    });

    mocks.callChat.mockResolvedValueOnce({ content: "" });

    await expect(generateDailyGreeting("user-1")).resolves.toEqual({
      created: false,
      notification: null,
    });
  });
});
