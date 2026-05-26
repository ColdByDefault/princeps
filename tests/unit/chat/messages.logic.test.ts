import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ChatFindFirstArgs = {
  where: { id: string; userId: string };
  select: { id: true; title: true; activeSkillId: true };
};

type ChatMessageFindManyArgs = {
  where: { chatId: string };
  orderBy: { createdAt: "asc" };
  take: 40;
  select: { id: true; role: true; content: true; createdAt: true };
};

type ChatMessageCreateArgs = {
  data: { chatId: string; role: "user" | "assistant"; content: string };
  select: { id: true };
};

type ChatUpdateArgs = {
  where: { id: string };
  data: { updatedAt: Date };
};

type DbMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
};

const mocks = vi.hoisted(() => ({
  chatFindFirst: vi.fn<
    (args: ChatFindFirstArgs) => Promise<{
      id: string;
      title: string;
      activeSkillId: string | null;
    } | null>
  >(),
  chatMessageCreate:
    vi.fn<(args: ChatMessageCreateArgs) => Promise<{ id: string }>>(),
  chatMessageFindMany:
    vi.fn<(args: ChatMessageFindManyArgs) => Promise<DbMessageRow[]>>(),
  chatUpdate: vi.fn<(args: ChatUpdateArgs) => Promise<unknown>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    chat: {
      findFirst: mocks.chatFindFirst,
      update: mocks.chatUpdate,
    },
    chatMessage: {
      create: mocks.chatMessageCreate,
      findMany: mocks.chatMessageFindMany,
    },
  },
}));

import {
  getChatMessages,
  saveAssistantMessage,
  saveUserMessage,
  touchChat,
} from "@/lib/features/chat/messages.logic";

describe("chat message logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chatFindFirst.mockResolvedValue({
      id: "chat-1",
      title: "Board planning",
      activeSkillId: null,
    });
    mocks.chatMessageFindMany.mockResolvedValue([]);
    mocks.chatMessageCreate.mockResolvedValue({ id: "message-1" });
    mocks.chatUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when the chat is not owned by the user", async () => {
    mocks.chatFindFirst.mockResolvedValueOnce(null);

    const result = await getChatMessages("chat-1", "user-1");

    expect(result).toBeNull();
    expect(mocks.chatFindFirst).toHaveBeenCalledWith({
      where: { id: "chat-1", userId: "user-1" },
      select: { id: true, title: true, activeSkillId: true },
    });
    expect(mocks.chatMessageFindMany).not.toHaveBeenCalled();
  });

  it("loads the latest chat messages for a user-owned chat", async () => {
    const userMessage = {
      id: "message-1",
      role: "user" as const,
      content: "What should I focus on today?",
      createdAt: new Date("2026-05-22T08:00:00.000Z"),
    };
    const assistantMessage = {
      id: "message-2",
      role: "assistant" as const,
      content: "Start with the board packet.",
      createdAt: new Date("2026-05-22T08:00:05.000Z"),
    };
    mocks.chatMessageFindMany.mockResolvedValue([
      userMessage,
      assistantMessage,
    ]);

    const result = await getChatMessages("chat-1", "user-1");

    expect(mocks.chatMessageFindMany).toHaveBeenCalledWith({
      where: { chatId: "chat-1" },
      orderBy: { createdAt: "asc" },
      take: 40,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    expect(result).toEqual({
      chat: { id: "chat-1", title: "Board planning", activeSkillId: null },
      messages: [userMessage, assistantMessage],
    });
  });

  it("saves user and assistant messages with the correct roles", async () => {
    mocks.chatMessageCreate
      .mockResolvedValueOnce({ id: "message-user" })
      .mockResolvedValueOnce({ id: "message-assistant" });

    await expect(
      saveUserMessage("chat-1", "What should I focus on today?"),
    ).resolves.toEqual({ id: "message-user" });
    await expect(
      saveAssistantMessage("chat-1", "Start with the board packet."),
    ).resolves.toEqual({ id: "message-assistant" });

    expect(mocks.chatMessageCreate).toHaveBeenNthCalledWith(1, {
      data: {
        chatId: "chat-1",
        role: "user",
        content: "What should I focus on today?",
      },
      select: { id: true },
    });
    expect(mocks.chatMessageCreate).toHaveBeenNthCalledWith(2, {
      data: {
        chatId: "chat-1",
        role: "assistant",
        content: "Start with the board packet.",
      },
      select: { id: true },
    });
  });

  it("touches the chat updatedAt timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));

    await touchChat("chat-1");

    expect(mocks.chatUpdate).toHaveBeenCalledWith({
      where: { id: "chat-1" },
      data: { updatedAt: new Date("2026-05-22T12:00:00.000Z") },
    });
  });
});
