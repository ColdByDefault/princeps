import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LLMChatOptions, LLMMessage } from "@/types/llm";
import type { BriefingRecord } from "@/types/api";

type BriefingUpsertArgs = {
  where: { userId: string };
  create: { userId: string; content: string };
  update: { content: string; generatedAt: Date };
  select: { id: true; content: true; generatedAt: true };
};

type UsageCounterUpsertArgs = {
  where: { userId: string };
  create: { userId: string; tokenMonthlyCount: number };
  update: { tokenMonthlyCount: { increment: number } };
};

type ListFilter = { status: string };

type BriefingCallChat = (
  messages: LLMMessage[],
  options?: LLMChatOptions,
) => Promise<{
  content: string;
  promptTokens: number;
  completionTokens: number;
}>;

const mocks = vi.hoisted(() => ({
  briefingUpsert: vi.fn<
    (
      args: BriefingUpsertArgs,
    ) => Promise<{ id: string; content: string; generatedAt: Date }>
  >(),
  callChat: vi.fn<BriefingCallChat>(),
  listDecisions: vi.fn<(userId: string, filter: ListFilter) => Promise<unknown[]>>(),
  listMeetings: vi.fn<(userId: string, filter: ListFilter) => Promise<unknown[]>>(),
  listTasks: vi.fn<(userId: string, filter: ListFilter) => Promise<unknown[]>>(),
  usageCounterUpsert: vi.fn<
    (args: UsageCounterUpsertArgs) => Promise<unknown>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    briefingCache: {
      upsert: mocks.briefingUpsert,
    },
    usageCounter: {
      upsert: mocks.usageCounterUpsert,
    },
  },
}));

vi.mock("@/lib/ai/llm-providers/provider", () => ({
  callChat: mocks.callChat,
}));

vi.mock("@/lib/features/tasks", () => ({
  listTasks: mocks.listTasks,
}));

vi.mock("@/lib/features/meetings", () => ({
  listMeetings: mocks.listMeetings,
}));

vi.mock("@/lib/features/decisions", () => ({
  listDecisions: mocks.listDecisions,
}));

import { generateBriefing } from "@/lib/features/briefings/generate.logic";

describe("generateBriefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T08:00:00.000Z"));
    mocks.listTasks
      .mockResolvedValueOnce([
        {
          title: "Send Q2 update",
          status: "open",
          dueDate: "2026-05-22T12:00:00.000Z",
          priority: "high",
        },
      ])
      .mockResolvedValueOnce([
        {
          title: "Prepare board packet",
          status: "in_progress",
          dueDate: null,
          priority: "urgent",
        },
      ]);
    mocks.listMeetings.mockResolvedValue([
      {
        title: "Board prep",
        scheduledAt: "2026-05-23T09:00:00.000Z",
        location: "HQ",
      },
      {
        title: "Far future",
        scheduledAt: "2026-06-30T09:00:00.000Z",
        location: null,
      },
    ]);
    mocks.listDecisions.mockResolvedValue([{ title: "Approve launch" }]);
    mocks.callChat.mockResolvedValue({
      content: "  ### Good morning\nFocus on launch readiness.  ",
      promptTokens: 30,
      completionTokens: 20,
    });
    mocks.briefingUpsert.mockResolvedValue({
      id: "briefing-1",
      content: "### Good morning\nFocus on launch readiness.",
      generatedAt: new Date("2026-05-22T08:00:00.000Z"),
    });
    mocks.usageCounterUpsert.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a briefing prompt, stores the trimmed result, and accounts for tokens", async () => {
    const result = await generateBriefing("user-1");

    expect(mocks.listTasks).toHaveBeenNthCalledWith(1, "user-1", {
      status: "open",
    });
    expect(mocks.listTasks).toHaveBeenNthCalledWith(2, "user-1", {
      status: "in_progress",
    });
    expect(mocks.listMeetings).toHaveBeenCalledWith("user-1", {
      status: "upcoming",
    });
    expect(mocks.listDecisions).toHaveBeenCalledWith("user-1", {
      status: "open",
    });

    expect(mocks.callChat).toHaveBeenCalled();
    const [messages, options] = mocks.callChat.mock.calls[0]!;
    const prompt = messages[0]?.content;
    expect(prompt).toContain("Today is 2026-05-22.");
    expect(prompt).toContain("- Prepare board packet [in progress]");
    expect(prompt).toContain("- Send Q2 update (due 2026-05-22)");
    expect(prompt).toContain("- Board prep — 2026-05-23 09:00 @ HQ");
    expect(prompt).not.toContain("Far future");
    expect(prompt).toContain("- Approve launch");
    expect(options).toEqual({ temperature: 0.3 });
    expect(mocks.briefingUpsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: {
        userId: "user-1",
        content: "### Good morning\nFocus on launch readiness.",
      },
      update: {
        content: "### Good morning\nFocus on launch readiness.",
        generatedAt: expect.any(Date),
      },
      select: { id: true, content: true, generatedAt: true },
    });
    expect(mocks.usageCounterUpsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1", tokenMonthlyCount: 50 },
      update: { tokenMonthlyCount: { increment: 50 } },
    });

    const expectedBriefing: BriefingRecord = {
      id: "briefing-1",
      content: "### Good morning\nFocus on launch readiness.",
      generatedAt: "2026-05-22T08:00:00.000Z",
    };
    expect(result).toEqual({ ok: true, briefing: expectedBriefing });
  });

  it("returns errors when the LLM fails or returns no content", async () => {
    mocks.callChat.mockRejectedValueOnce(new Error("llm unavailable"));

    await expect(generateBriefing("user-1")).resolves.toEqual({
      ok: false,
      error: "LLM call failed.",
    });

    mocks.listTasks.mockResolvedValue([]);
    mocks.listMeetings.mockResolvedValue([]);
    mocks.listDecisions.mockResolvedValue([]);
    mocks.callChat.mockResolvedValueOnce({
      content: "",
      promptTokens: 1,
      completionTokens: 0,
    });

    await expect(generateBriefing("user-1")).resolves.toEqual({
      ok: false,
      error: "No content returned from LLM.",
    });
  });

  it("uses empty-state context when there is no workspace data", async () => {
    mocks.listTasks.mockReset();
    mocks.listTasks.mockResolvedValue([]);
    mocks.listMeetings.mockResolvedValue([]);
    mocks.listDecisions.mockResolvedValue([]);

    await generateBriefing("user-1");

    expect(mocks.callChat).toHaveBeenCalled();
    const [messages] = mocks.callChat.mock.calls[0]!;
    const prompt = messages[0]?.content;
    expect(prompt).toContain("No open tasks.");
    expect(prompt).toContain("No upcoming meetings.");
    expect(prompt).toContain("No open decisions pending.");
  });
});
