import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatSummary } from "@/types/chat";

type ChatFindManyArgs = {
  where: { userId: string };
  orderBy: { updatedAt: "desc" };
  take: number;
  select: {
    id: true;
    title: true;
    createdAt: true;
    updatedAt: true;
    _count: { select: { messages: true } };
  };
};

type DbChatSummaryRow = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { messages: number };
};

const mocks = vi.hoisted(() => ({
  chatFindMany: vi.fn<
    (args: ChatFindManyArgs) => Promise<DbChatSummaryRow[]>
  >(),
  getChatHistoryLimit: vi.fn<(userId: string) => Promise<number>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    chat: {
      findMany: mocks.chatFindMany,
    },
  },
}));

vi.mock("@/lib/platform/tiers", () => ({
  getChatHistoryLimit: mocks.getChatHistoryLimit,
}));

import { listChats } from "@/lib/features/chat/list.logic";

describe("listChats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getChatHistoryLimit.mockResolvedValue(25);
  });

  it("lists user-scoped chat summaries up to the user's history limit", async () => {
    mocks.chatFindMany.mockResolvedValue([
      {
        id: "chat-1",
        title: "Board planning",
        createdAt: new Date("2026-05-20T08:00:00.000Z"),
        updatedAt: new Date("2026-05-22T10:00:00.000Z"),
        _count: { messages: 4 },
      },
    ]);

    const result = await listChats("user-1");

    expect(mocks.getChatHistoryLimit).toHaveBeenCalledWith("user-1");
    expect(mocks.chatFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    const expected: ChatSummary[] = [
      {
        id: "chat-1",
        title: "Board planning",
        createdAt: "2026-05-20T08:00:00.000Z",
        updatedAt: "2026-05-22T10:00:00.000Z",
        messageCount: 4,
      },
    ];
    expect(result).toEqual(expected);
  });
});
