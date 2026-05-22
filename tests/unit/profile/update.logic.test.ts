import { beforeEach, describe, expect, it, vi } from "vitest";

type UserFindFirstArgs = {
  where: { username: string; NOT: { id: string } };
  select: { id: true };
};

type UserUpdateArgs = {
  where: { id: string };
  data: {
    name?: string;
    username?: string;
    displayUsername?: string;
  };
  select: { name: true; username: true };
};

const mocks = vi.hoisted(() => ({
  userFindFirst: vi.fn<
    (args: UserFindFirstArgs) => Promise<{ id: string } | null>
  >(),
  userUpdate: vi.fn<
    (args: UserUpdateArgs) => Promise<{ name: string | null; username: string | null }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    user: {
      findFirst: mocks.userFindFirst,
      update: mocks.userUpdate,
    },
  },
}));

import { updateProfile } from "@/lib/features/profile/update.logic";

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.userUpdate.mockResolvedValue({
      name: "Yazan",
      username: "yazan.dev",
    });
  });

  it("returns an error when there is nothing to update", async () => {
    const result = await updateProfile("user-1", {});

    expect(result).toEqual({ ok: false, error: "Nothing to update." });
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("rejects a username already owned by another user", async () => {
    mocks.userFindFirst.mockResolvedValueOnce({ id: "other-user" });

    const result = await updateProfile("user-1", { username: "Yazan.Dev" });

    expect(result).toEqual({
      ok: false,
      error: "Username is already taken.",
    });
    expect(mocks.userFindFirst).toHaveBeenCalledWith({
      where: { username: "yazan.dev", NOT: { id: "user-1" } },
      select: { id: true },
    });
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("updates name and stores a lowercase username plus display username", async () => {
    const result = await updateProfile("user-1", {
      name: "Yazan",
      username: "Yazan.Dev",
    });

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Yazan",
        username: "yazan.dev",
        displayUsername: "Yazan.Dev",
      },
      select: { name: true, username: true },
    });
    expect(result).toEqual({
      ok: true,
      name: "Yazan",
      username: "yazan.dev",
    });
  });
});
