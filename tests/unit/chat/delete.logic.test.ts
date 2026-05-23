import { beforeEach, describe, expect, it, vi } from "vitest";

type ChatFindFirstArgs = {
  where: { id: string; userId: string };
};

type ChatDeleteArgs = {
  where: { id: string };
};

const mocks = vi.hoisted(() => ({
  chatDelete: vi.fn<(args: ChatDeleteArgs) => Promise<unknown>>(),
  chatFindFirst: vi.fn<
    (args: ChatFindFirstArgs) => Promise<{ id: string } | null>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    chat: {
      delete: mocks.chatDelete,
      findFirst: mocks.chatFindFirst,
    },
  },
}));

import { deleteChat } from "@/lib/features/chat/delete.logic";

describe("deleteChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a user-owned chat", async () => {
    mocks.chatFindFirst.mockResolvedValue({ id: "chat-1" });
    mocks.chatDelete.mockResolvedValue({});

    const result = await deleteChat("chat-1", "user-1");

    expect(mocks.chatFindFirst).toHaveBeenCalledWith({
      where: { id: "chat-1", userId: "user-1" },
    });
    expect(mocks.chatDelete).toHaveBeenCalledWith({
      where: { id: "chat-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when the chat is missing or owned by another user", async () => {
    mocks.chatFindFirst.mockResolvedValue(null);

    const result = await deleteChat("chat-1", "user-1");

    expect(mocks.chatDelete).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false });
  });
});
