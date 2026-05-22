import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatSummary } from "@/types/chat";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";

type ListChats = (userId: string) => Promise<ChatSummary[]>;
type CreateChat = (
  userId: string,
) => Promise<
  | { ok: true; chatId: string }
  | { ok: false; limitReached: true }
  | { ok: false; limitReached: false; error: string }
>;

const mocks = vi.hoisted(() => ({
  createChat: vi.fn<CreateChat>(),
  getChatHistoryLimit: vi.fn<(userId: string) => Promise<number>>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listChats: vi.fn<ListChats>(),
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

vi.mock("@/lib/features/chat", () => ({
  createChat: mocks.createChat,
  listChats: mocks.listChats,
}));

vi.mock("@/lib/platform/tiers", () => ({
  getChatHistoryLimit: mocks.getChatHistoryLimit,
}));

import { GET, POST } from "@/app/api/chat/route";

const chatSummary: ChatSummary = {
  id: "chat-1",
  title: "Board planning",
  createdAt: "2026-05-20T08:00:00.000Z",
  updatedAt: "2026-05-22T10:00:00.000Z",
  messageCount: 4,
};

describe("/api/chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listChats.mockResolvedValue([chatSummary]);
    mocks.getChatHistoryLimit.mockResolvedValue(25);
    mocks.createChat.mockResolvedValue({ ok: true, chatId: "chat-created" });
  });

  it("lists chats and history limit for the authenticated user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      chats: [chatSummary],
      historyLimit: 25,
    });
    expect(mocks.listChats).toHaveBeenCalledWith("user-1");
    expect(mocks.getChatHistoryLimit).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 when listing without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.listChats).not.toHaveBeenCalled();
  });

  it("creates a chat for the authenticated user", async () => {
    const response = await POST();

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      chatId: "chat-created",
    });
    expect(mocks.createChat).toHaveBeenCalledWith("user-1");
  });

  it("returns 409 when chat creation is blocked by limits", async () => {
    mocks.createChat.mockResolvedValueOnce({ ok: false, limitReached: true });

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Chat limit reached. Delete a chat to create a new one.",
    });
  });

  it("returns 500 for non-limit chat creation failures", async () => {
    mocks.createChat.mockResolvedValueOnce({
      ok: false,
      limitReached: false,
      error: "Database unavailable.",
    });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Database unavailable.",
    });
  });
});
