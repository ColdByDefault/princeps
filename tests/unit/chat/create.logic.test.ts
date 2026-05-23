import { beforeEach, describe, expect, it, vi } from "vitest";

type ChatCountArgs = {
  where: { userId: string };
};

type ChatCreateArgs = {
  data: { userId: string; title: string };
  select: { id: true };
};

type ChatFindFirstArgs = {
  where: { userId: string };
  orderBy: { updatedAt: "desc" };
  select: { id: true };
};

type ChatUpdateArgs = {
  where: { id: string };
  data: { title: string };
};

type EnforceResult =
  | { allowed: true }
  | { allowed: false; reason?: string };

const mocks = vi.hoisted(() => ({
  chatCount: vi.fn<(args: ChatCountArgs) => Promise<number>>(),
  chatCreate: vi.fn<(args: ChatCreateArgs) => Promise<{ id: string }>>(),
  chatFindFirst: vi.fn<
    (args: ChatFindFirstArgs) => Promise<{ id: string } | null>
  >(),
  chatUpdate: vi.fn<(args: ChatUpdateArgs) => Promise<unknown>>(),
  enforceChatsPerDay: vi.fn<(userId: string) => Promise<EnforceResult>>(),
  getChatHistoryLimit: vi.fn<(userId: string) => Promise<number>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    chat: {
      count: mocks.chatCount,
      create: mocks.chatCreate,
      findFirst: mocks.chatFindFirst,
      update: mocks.chatUpdate,
    },
  },
}));

vi.mock("@/lib/platform/tiers", () => ({
  enforceChatsPerDay: mocks.enforceChatsPerDay,
  getChatHistoryLimit: mocks.getChatHistoryLimit,
}));

import {
  createChat,
  getOrCreateFirstChat,
  setInitialTitle,
} from "@/lib/features/chat/create.logic";

describe("chat create logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceChatsPerDay.mockResolvedValue({ allowed: true });
    mocks.getChatHistoryLimit.mockResolvedValue(3);
    mocks.chatCount.mockResolvedValue(0);
    mocks.chatCreate.mockResolvedValue({ id: "chat-created" });
    mocks.chatFindFirst.mockResolvedValue(null);
    mocks.chatUpdate.mockResolvedValue({});
  });

  it("creates a new chat when daily and history limits allow it", async () => {
    const result = await createChat("user-1");

    expect(result).toEqual({ ok: true, chatId: "chat-created" });
    expect(mocks.enforceChatsPerDay).toHaveBeenCalledWith("user-1");
    expect(mocks.getChatHistoryLimit).toHaveBeenCalledWith("user-1");
    expect(mocks.chatCount).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mocks.chatCreate).toHaveBeenCalledWith({
      data: { userId: "user-1", title: "New chat" },
      select: { id: true },
    });
  });

  it("returns limitReached when the daily creation limit blocks the user", async () => {
    mocks.enforceChatsPerDay.mockResolvedValueOnce({
      allowed: false,
      reason: "Daily chat limit reached for your plan.",
    });

    const result = await createChat("user-1");

    expect(result).toEqual({ ok: false, limitReached: true });
    expect(mocks.getChatHistoryLimit).not.toHaveBeenCalled();
    expect(mocks.chatCount).not.toHaveBeenCalled();
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });

  it("returns limitReached when the user has filled chat history", async () => {
    mocks.getChatHistoryLimit.mockResolvedValueOnce(2);
    mocks.chatCount.mockResolvedValueOnce(2);

    const result = await createChat("user-1");

    expect(result).toEqual({ ok: false, limitReached: true });
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });

  it("sets the initial title from the first user message", async () => {
    await setInitialTitle("chat-1", "  Draft board memo  ");

    expect(mocks.chatUpdate).toHaveBeenCalledWith({
      where: { id: "chat-1" },
      data: { title: "Draft board memo" },
    });
  });

  it("falls back to New chat when the first message has no title text", async () => {
    await setInitialTitle("chat-1", "   ");

    expect(mocks.chatUpdate).toHaveBeenCalledWith({
      where: { id: "chat-1" },
      data: { title: "New chat" },
    });
  });

  it("returns the most recent chat when one already exists", async () => {
    mocks.chatFindFirst.mockResolvedValueOnce({ id: "chat-existing" });

    const result = await getOrCreateFirstChat("user-1");

    expect(result).toBe("chat-existing");
    expect(mocks.chatFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    expect(mocks.enforceChatsPerDay).not.toHaveBeenCalled();
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });

  it("creates the first chat when the user has no chat history", async () => {
    const result = await getOrCreateFirstChat("user-1");

    expect(result).toBe("chat-created");
    expect(mocks.chatCreate).toHaveBeenCalledWith({
      data: { userId: "user-1", title: "New chat" },
      select: { id: true },
    });
  });

  it("returns null when no chat exists and creation is blocked", async () => {
    mocks.enforceChatsPerDay.mockResolvedValueOnce({ allowed: false });

    const result = await getOrCreateFirstChat("user-1");

    expect(result).toBeNull();
    expect(mocks.chatCreate).not.toHaveBeenCalled();
  });
});
