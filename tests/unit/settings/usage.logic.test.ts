import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  chatCount: vi.fn<() => Promise<number>>(),
  contactCount: vi.fn<() => Promise<number>>(),
  decisionCount: vi.fn<() => Promise<number>>(),
  goalCount: vi.fn<() => Promise<number>>(),
  knowledgeDocumentCount: vi.fn<() => Promise<number>>(),
  meetingCount: vi.fn<() => Promise<number>>(),
  memoryEntryCount: vi.fn<() => Promise<number>>(),
  readingItemCount: vi.fn<() => Promise<number>>(),
  taskCount: vi.fn<() => Promise<number>>(),
  usageCounterFindUnique:
    vi.fn<() => Promise<Record<string, unknown> | null>>(),
  userFindUniqueOrThrow:
    vi.fn<() => Promise<{ tier: string; knowledgeCharsUsed: number }>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    chat: { count: mocks.chatCount },
    contact: { count: mocks.contactCount },
    decision: { count: mocks.decisionCount },
    goal: { count: mocks.goalCount },
    knowledgeDocument: { count: mocks.knowledgeDocumentCount },
    meeting: { count: mocks.meetingCount },
    memoryEntry: { count: mocks.memoryEntryCount },
    readingItem: { count: mocks.readingItemCount },
    task: { count: mocks.taskCount },
    usageCounter: { findUnique: mocks.usageCounterFindUnique },
    user: { findUniqueOrThrow: mocks.userFindUniqueOrThrow },
  },
}));

import { getUserUsage } from "@/lib/platform/settings/usage.logic";

describe("getUserUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));
    mocks.userFindUniqueOrThrow.mockResolvedValue({
      tier: "pro",
      knowledgeCharsUsed: 1234,
    });
    mocks.chatCount.mockResolvedValue(2);
    mocks.knowledgeDocumentCount.mockResolvedValue(3);
    mocks.contactCount.mockResolvedValue(4);
    mocks.taskCount.mockResolvedValue(5);
    mocks.meetingCount.mockResolvedValue(6);
    mocks.decisionCount.mockResolvedValue(7);
    mocks.goalCount.mockResolvedValue(8);
    mocks.memoryEntryCount.mockResolvedValue(9);
    mocks.readingItemCount.mockResolvedValue(0);
    mocks.usageCounterFindUnique.mockResolvedValue({
      messageMonthlyCount: 10,
      tokenMonthlyCount: 11,
      toolMonthlyCount: 12,
      prepPackMonthlyCount: 13,
      briefingMonthlyCount: 14,
      voiceRequestsDailyCount: 15,
      voiceRequestsMonthlyCount: 16,
      voiceSecondsMonthlyCount: 125,
      monthlyResetDate: "2026-05",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("combines usage counters, stored entity counts, and plan limits", async () => {
    const result = await getUserUsage("user-1");

    expect(result).toMatchObject({
      tier: "pro",
      messagesUsed: 10,
      messagesLimit: 250,
      tokensUsed: 11,
      tokensLimit: 400000,
      chatsStored: 2,
      chatsLimit: 25,
      knowledgeDocsStored: 3,
      knowledgeCharsUsed: 1234,
      contactsStored: 4,
      tasksStored: 5,
      meetingsStored: 6,
      decisionsStored: 7,
      goalsStored: 8,
      memoryStored: 9,
      readingQueueStored: 0,
      readingQueueLimit: 50,
      prepPacksGenerated: 13,
      briefingsGenerated: 14,
      voiceRequestsUsed: 15,
      voiceRequestsMonthlyUsed: 16,
      voiceMinutesUsed: 2.1,
      monthlyResetDate: "2026-05",
    });
  });

  it("defaults missing counters to zero and the current month", async () => {
    mocks.usageCounterFindUnique.mockResolvedValueOnce(null);

    const result = await getUserUsage("user-1");

    expect(result.messagesUsed).toBe(0);
    expect(result.tokensUsed).toBe(0);
    expect(result.toolCallsUsed).toBe(0);
    expect(result.voiceMinutesUsed).toBe(0);
    expect(result.monthlyResetDate).toBe("2026-05");
  });
});
