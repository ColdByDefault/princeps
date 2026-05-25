import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";

type DeleteChat = (chatId: string, userId: string) => Promise<{ ok: boolean }>;
type RenameChat = (
  chatId: string,
  userId: string,
  title: string,
) => Promise<{ ok: true } | { ok: false; error: string }>;
type SetChatActiveSkill = (
  chatId: string,
  userId: string,
  activeSkillId: string | null,
) => Promise<{ ok: true } | { ok: false; error: string }>;

const mocks = vi.hoisted(() => ({
  deleteChat: vi.fn<DeleteChat>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  patchChatSafeParse: vi.fn(),
  renameChat: vi.fn<RenameChat>(),
  setChatActiveSkill: vi.fn<SetChatActiveSkill>(),
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
  patchChatSchema: {
    safeParse: mocks.patchChatSafeParse,
  },
  renameChat: mocks.renameChat,
  setChatActiveSkill: mocks.setChatActiveSkill,
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
    mocks.setChatActiveSkill.mockResolvedValue({ ok: true });
    mocks.patchChatSafeParse.mockImplementation((body: unknown) => ({
      success: true,
      data: body as { title?: string; activeSkillId?: string | null },
    }));
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
    expect(mocks.setChatActiveSkill).not.toHaveBeenCalled();
  });

  it("sets the active skill for a chat", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/chat/chat-1", {
        body: JSON.stringify({ activeSkillId: "skill-1" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.setChatActiveSkill).toHaveBeenCalledWith(
      "chat-1",
      "user-1",
      "skill-1",
    );
    expect(mocks.renameChat).not.toHaveBeenCalled();
  });

  it("supports updating title and active skill in one request", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/chat/chat-1", {
        body: JSON.stringify({ title: "Ops review", activeSkillId: null }),
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
      "Ops review",
    );
    expect(mocks.setChatActiveSkill).toHaveBeenCalledWith(
      "chat-1",
      "user-1",
      null,
    );
  });

  it("returns 400 for invalid patch input", async () => {
    mocks.patchChatSafeParse.mockReturnValueOnce({ success: false });

    const response = await PATCH(
      new Request("http://localhost/api/chat/chat-1", {
        body: JSON.stringify({ title: "   " }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid input" });
    expect(mocks.renameChat).not.toHaveBeenCalled();
    expect(mocks.setChatActiveSkill).not.toHaveBeenCalled();
  });

  it("returns 404 when active skill update fails", async () => {
    mocks.setChatActiveSkill.mockResolvedValueOnce({
      ok: false,
      error: "Skill not found",
    });

    const response = await PATCH(
      new Request("http://localhost/api/chat/chat-1", {
        body: JSON.stringify({ activeSkillId: "missing-skill" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Skill not found",
    });
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
