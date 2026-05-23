import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LLMMessage } from "@/types/llm";

type UserRow = {
  id: string;
  tier: string;
  preferences: unknown;
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
  select: { id: true };
};

type NotificationFindFirstArgs = {
  where: { userId: string; category: string };
  orderBy: { createdAt: "desc" };
  select: { metadata: true };
};

type CountArgs = {
  where: {
    userId: string;
    status?: string;
    updatedAt?: { gte: Date; lt: Date };
    createdAt?: { gte: Date; lt: Date };
  };
};

type MeetingFindManyArgs = {
  where: {
    userId: string;
    status: string;
    scheduledAt: { gte: Date; lt: Date };
  };
  select: { title: true };
  take: 5;
};

type DigestCallChat = (
  messages: LLMMessage[],
) => Promise<{ content: string }>;

const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  callChat: vi.fn<DigestCallChat>(),
  decisionCount: vi.fn<(args: CountArgs) => Promise<number>>(),
  meetingFindMany: vi.fn<
    (args: MeetingFindManyArgs) => Promise<Array<{ title: string }>>
  >(),
  notificationCreate: vi.fn<
    (args: NotificationCreateArgs) => Promise<{ id: string }>
  >(),
  notificationFindFirst: vi.fn<
    (args: NotificationFindFirstArgs) => Promise<{ metadata: unknown } | null>
  >(),
  taskCount: vi.fn<(args: CountArgs) => Promise<number>>(),
  userFindMany: vi.fn<() => Promise<UserRow[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    decision: {
      count: mocks.decisionCount,
    },
    meeting: {
      findMany: mocks.meetingFindMany,
    },
    notification: {
      create: mocks.notificationCreate,
      findFirst: mocks.notificationFindFirst,
    },
    task: {
      count: mocks.taskCount,
    },
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

vi.mock("@/lib/ai/llm-providers/provider", () => ({
  callChat: mocks.callChat,
}));

vi.mock("@/lib/platform/tiers/enforce", () => ({
  accumulateTokens: mocks.accumulateTokens,
}));

import { runWeeklyDigestNudges } from "@/lib/features/notifications/nudge-digest.logic";

describe("runWeeklyDigestNudges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callChat.mockResolvedValue({ content: "  A focused week in review.  " });
    mocks.accumulateTokens.mockResolvedValue();
    mocks.notificationCreate.mockResolvedValue({ id: "digest-1" });
  });

  it("scans users, applies tier/preferences/cooldown checks, and creates weekly digests", async () => {
    mocks.userFindMany.mockResolvedValue([
      { id: "free-user", tier: "free", preferences: {} },
      {
        id: "notifications-off",
        tier: "pro",
        preferences: { notificationsEnabled: false },
      },
      {
        id: "cooldown-user",
        tier: "pro",
        preferences: { language: "en" },
      },
      {
        id: "quiet-user",
        tier: "pro",
        preferences: { language: "de" },
      },
      {
        id: "active-user",
        tier: "pro",
        preferences: { language: "en" },
      },
      {
        id: "failed-user",
        tier: "pro",
        preferences: { language: "en" },
      },
    ]);

    mocks.notificationFindFirst.mockImplementation(async ({ where }) => {
      if (where.userId === "failed-user") throw new Error("db failed");
      if (where.userId === "cooldown-user") {
        return { metadata: { isoWeek: "2026-W21" } };
      }
      return null;
    });
    mocks.taskCount.mockImplementation(async ({ where }) =>
      where.userId === "active-user" ? 3 : 0,
    );
    mocks.decisionCount.mockImplementation(async ({ where }) =>
      where.userId === "active-user" ? 2 : 0,
    );
    mocks.meetingFindMany.mockImplementation(async ({ where }) =>
      where.userId === "active-user"
        ? [{ title: "Board prep" }, { title: "Hiring sync" }]
        : [],
    );

    const result = await runWeeklyDigestNudges(
      new Date("2026-05-22T12:00:00.000Z"),
    );

    expect(result).toEqual({
      usersScanned: 6,
      eligibleUsers: 5,
      skippedTier: 1,
      skippedNotifications: 1,
      skippedCooldown: 1,
      noActivity: 1,
      created: 1,
      failed: 1,
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      select: { id: true, tier: true, preferences: true },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "active-user",
        category: "weekly_digest",
        source: "assistant",
        title: "Weekly Digest",
        body: "A focused week in review.",
        metadata: {
          isoWeek: "2026-W21",
          closedTaskCount: 3,
          decisionCount: 2,
          completedMeetingCount: 2,
        },
      },
      select: { id: true },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "quiet-user",
        title: "Wöchentliche Zusammenfassung",
        metadata: expect.objectContaining({
          closedTaskCount: 0,
          decisionCount: 0,
          completedMeetingCount: 0,
        }),
      }),
      select: { id: true },
    });

    const activeDigestCall = mocks.callChat.mock.calls.find(([messages]) =>
      messages[1]?.content?.includes("Board prep"),
    );
    expect(activeDigestCall).toBeDefined();
    const [messages] = activeDigestCall!;
    expect(messages[0]?.content).toContain("Respond only in English.");
    expect(messages[1]?.content).toContain("Tasks completed this week: 3");
    expect(messages[1]?.content).toContain("Decisions recorded: 2");
    expect(messages[1]?.content).toContain("- Hiring sync");
    expect(mocks.accumulateTokens).toHaveBeenCalledTimes(2);
  });

  it("stores localized fallback copy when digest generation fails", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        id: "fallback-user",
        tier: "pro",
        preferences: { language: "en" },
      },
    ]);
    mocks.notificationFindFirst.mockResolvedValue(null);
    mocks.taskCount.mockResolvedValue(1);
    mocks.decisionCount.mockResolvedValue(0);
    mocks.meetingFindMany.mockResolvedValue([]);
    mocks.callChat.mockRejectedValueOnce(new Error("llm unavailable"));

    const result = await runWeeklyDigestNudges(
      new Date("2026-05-22T12:00:00.000Z"),
    );

    expect(result).toMatchObject({ created: 1, failed: 0 });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "fallback-user",
        title: "Weekly Digest",
        body: "Your weekly digest could not be generated this time. Please try again or contact support.",
      }),
      select: { id: true },
    });
    expect(mocks.accumulateTokens).not.toHaveBeenCalled();
  });
});
