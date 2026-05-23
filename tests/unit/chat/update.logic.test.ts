import { beforeEach, describe, expect, it, vi } from "vitest";

type ChatFindFirstArgs = {
  where: { id: string; userId: string };
};

type ChatUpdateArgs = {
  where: { id: string };
  data: { title: string };
};

const mocks = vi.hoisted(() => ({
  chatFindFirst: vi.fn<
    (args: ChatFindFirstArgs) => Promise<{ id: string } | null>
  >(),
  chatUpdate: vi.fn<(args: ChatUpdateArgs) => Promise<unknown>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    chat: {
      findFirst: mocks.chatFindFirst,
      update: mocks.chatUpdate,
    },
  },
}));

import { renameChat } from "@/lib/features/chat/update.logic";

describe("renameChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chatFindFirst.mockResolvedValue({ id: "chat-1" });
    mocks.chatUpdate.mockResolvedValue({});
  });

  it("rejects empty titles before querying", async () => {
    const result = await renameChat("chat-1", "user-1", "   ");

    expect(result).toEqual({ ok: false, error: "Title cannot be empty" });
    expect(mocks.chatFindFirst).not.toHaveBeenCalled();
    expect(mocks.chatUpdate).not.toHaveBeenCalled();
  });

  it("returns not found when the chat is not owned by the user", async () => {
    mocks.chatFindFirst.mockResolvedValueOnce(null);

    const result = await renameChat("chat-1", "user-1", "Board planning");

    expect(result).toEqual({ ok: false, error: "Not found" });
    expect(mocks.chatFindFirst).toHaveBeenCalledWith({
      where: { id: "chat-1", userId: "user-1" },
    });
    expect(mocks.chatUpdate).not.toHaveBeenCalled();
  });

  it("renames a user-owned chat with a trimmed and capped title", async () => {
    const longTitle = `  ${"x".repeat(100)}  `;

    const result = await renameChat("chat-1", "user-1", longTitle);

    expect(result).toEqual({ ok: true });
    expect(mocks.chatUpdate).toHaveBeenCalledWith({
      where: { id: "chat-1" },
      data: { title: "x".repeat(80) },
    });
  });
});
