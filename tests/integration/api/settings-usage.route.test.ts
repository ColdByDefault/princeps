import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsageSummary } from "@/types/billing";

const usage: UsageSummary = {
  tier: "pro",
  messagesUsed: 10,
  messagesLimit: 250,
  tokensUsed: 100,
  tokensLimit: 400000,
  chatsStored: 2,
  chatsLimit: 25,
  toolCallsUsed: 3,
  toolCallsLimit: 200,
  knowledgeDocsStored: 1,
  knowledgeDocsLimit: 25,
  knowledgeCharsUsed: 1200,
  knowledgeCharsLimit: 500000,
  contactsStored: 4,
  contactsLimit: 25,
  tasksStored: 5,
  tasksLimit: 100,
  meetingsStored: 6,
  meetingsLimit: 50,
  decisionsStored: 7,
  decisionsLimit: 50,
  goalsStored: 8,
  goalsLimit: 25,
  memoryStored: 9,
  memoryLimit: 100,
  prepPacksGenerated: 1,
  prepPacksLimit: 10,
  briefingsGenerated: 2,
  briefingsLimit: 30,
  voiceRequestsUsed: 3,
  voiceRequestsLimit: 30,
  voiceRequestsMonthlyUsed: 4,
  voiceRequestsMonthlyLimit: 200,
  voiceMinutesUsed: 2.1,
  voiceMinutesLimit: 60,
  monthlyResetDate: "2026-05",
};

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  getSession: vi.fn<GetSession>(),
  getUserUsage: vi.fn<(userId: string) => Promise<UsageSummary>>(),
  headers: vi.fn<HeadersProvider>(),
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

vi.mock("@/lib/platform/settings", () => ({
  getUserUsage: mocks.getUserUsage,
}));

import { GET } from "@/app/api/settings/usage/route";

describe("/api/settings/usage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getUserUsage.mockResolvedValue(usage);
  });

  it("returns usage for the authenticated user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(usage);
    expect(mocks.getUserUsage).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getUserUsage).not.toHaveBeenCalled();
  });
});
