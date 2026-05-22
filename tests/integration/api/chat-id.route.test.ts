import { beforeEach, describe, expect, it, vi } from "vitest";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type DeleteChat = (chatId: string, userId: string) => Promise<{ ok: boolean }>;
type RenameChat = (
  chatId: string,
  userId: string,
  title: string,
) => Promise<{ ok: true } | { ok: false; error: string }>;

const mocks = vi.hoisted(() => ({
  deleteChat: vi.fn<DeleteChat>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  renameChat: vi.fn<RenameChat>(),
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
  deleteChat: mocks.deleteChat,
  renameChat: mocks.renameChat,
}));

import { DELETE, PATCH } from "@/app/api/chat/[chatId]/route";

function params(chatId = "chat-1") {
  return { params: Promise.resolve({ chatId }) };
}

describe("/api/chat/[chatId] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.deleteChat.mockResolvedValue({ ok: true });
    mocks.renameChat.mockResolvedValue({ ok: true });
  });

  it("deletes a user-owned chat", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/chat/chat-1", { method: "DELETE" }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.deleteChat).toHaveBeenCalledWith("chat-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned chat", async () => {
    mocks.deleteChat.mockResolvedValueOnce({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/chat/chat-1", { method: "DELETE" }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("renames a user-owned chat", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/chat/chat-1", {
        body: JSON.stringify({ title: "Board planning" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.renameChat).toHaveBeenCalledWith(
      "chat-1",
      "user-1",
      "Board planning",
    );
  });

  it("returns 400 for invalid rename input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/chat/chat-1", {
        body: JSON.stringify({ title: "   " }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid title" });
    expect(mocks.renameChat).not.toHaveBeenCalled();
  });

  it("returns 401 when mutating without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await DELETE(
      new Request("http://localhost/api/chat/chat-1", { method: "DELETE" }),
      params(),
    );

    expect(response.status).toBe(401);
    expect(mocks.deleteChat).not.toHaveBeenCalled();
  });
});
