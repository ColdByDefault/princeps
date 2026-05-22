import { beforeEach, describe, expect, it, vi } from "vitest";

type UserRow = {
  id: string;
  tier: string;
  preferences: unknown;
};

type TransactionClient = {
  notification: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  task: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

const mocks = vi.hoisted(() => ({
  transaction: vi.fn<
    (
      callback: (tx: TransactionClient) => Promise<unknown>,
      options?: unknown,
    ) => Promise<unknown>
  >(),
  userFindMany: vi.fn<() => Promise<UserRow[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    $transaction: mocks.transaction,
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

import { runOverdueTaskNudges } from "@/lib/features/notifications/nudge-overdue.logic";

describe("runOverdueTaskNudges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scans users, applies tier/preferences/cooldown checks, and creates nudges", async () => {
    mocks.userFindMany.mockResolvedValue([
      { id: "free-user", tier: "free", preferences: {} },
      {
        id: "notifications-off",
        tier: "pro",
        preferences: { notificationsEnabled: false },
      },
      {
        id: "nudges-off",
        tier: "pro",
        preferences: { overdueTaskNudgesEnabled: false },
      },
      {
        id: "cooldown-user",
        tier: "pro",
        preferences: { language: "en" },
      },
      {
        id: "none-user",
        tier: "pro",
        preferences: { language: "en" },
      },
      {
        id: "created-user",
        tier: "pro",
        preferences: { language: "en" },
      },
      {
        id: "failed-user",
        tier: "pro",
        preferences: { language: "en" },
      },
    ]);

    const notificationCreate = vi.fn();
    const tx: TransactionClient = {
      notification: {
        findFirst: vi.fn(async ({ where }) => {
          if (where.userId === "failed-user") throw new Error("db failed");
          return where.userId === "cooldown-user" ? { id: "nudge-1" } : null;
        }),
        create: notificationCreate,
      },
      task: {
        count: vi.fn(async ({ where }) =>
          where.userId === "created-user" ? 4 : 0,
        ),
        findMany: vi.fn(async () => [
          {
            id: "task-1",
            title: "Review board packet",
            status: "open",
            priority: "high",
            dueDate: new Date("2026-05-20T08:00:00.000Z"),
          },
          {
            id: "task-2",
            title: "Send follow-up",
            status: "in_progress",
            priority: "normal",
            dueDate: null,
          },
          {
            id: "task-3",
            title: "Prepare notes",
            status: "open",
            priority: "low",
            dueDate: null,
          },
        ]),
      },
    };
    mocks.transaction.mockImplementation(async (callback) => callback(tx));

    const result = await runOverdueTaskNudges(
      new Date("2026-05-22T12:00:00.000Z"),
    );

    expect(result).toEqual({
      usersScanned: 7,
      eligibleUsers: 6,
      skippedTier: 1,
      skippedNotifications: 1,
      skippedUserPreference: 1,
      skippedCooldown: 1,
      withoutOverdueTasks: 1,
      created: 1,
      failed: 1,
    });
    expect(notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "created-user",
        category: "overdue_tasks",
        source: "assistant",
        title: "4 overdue tasks",
        metadata: expect.objectContaining({
          date: "2026-05-22",
          overdueCount: 4,
          previewTaskIds: ["task-1", "task-2", "task-3"],
        }),
      }),
      select: { id: true },
    });
    const createdBody = notificationCreate.mock.calls[0]?.[0].data.body;
    expect(createdBody).toContain("These tasks are past their due date:");
    expect(createdBody).toContain("- Review board packet");
    expect(createdBody).toContain("And 1 more.");
  });

  it("retries serialization conflicts before failing the user", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        id: "created-user",
        tier: "pro",
        preferences: { language: "en" },
      },
    ]);

    let attempts = 0;
    const notificationCreate = vi.fn();
    const tx: TransactionClient = {
      notification: {
        findFirst: vi.fn(async () => null),
        create: notificationCreate,
      },
      task: {
        count: vi.fn(async () => 1),
        findMany: vi.fn(async () => [
          {
            id: "task-1",
            title: "Review board packet",
            status: "open",
            priority: "high",
            dueDate: null,
          },
        ]),
      },
    };
    mocks.transaction.mockImplementation(async (callback) => {
      attempts++;
      if (attempts === 1) throw { code: "P2034" };
      return callback(tx);
    });

    const result = await runOverdueTaskNudges(
      new Date("2026-05-22T12:00:00.000Z"),
    );

    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });
});
