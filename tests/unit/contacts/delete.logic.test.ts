import { beforeEach, describe, expect, it, vi } from "vitest";

type ContactDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  contactDeleteMany: vi.fn<
    (args: ContactDeleteManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    contact: {
      deleteMany: mocks.contactDeleteMany,
    },
  },
}));

import { deleteContact } from "@/lib/contacts/delete.logic";

describe("deleteContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a user-owned contact", async () => {
    mocks.contactDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteContact("contact-1", "user-1");

    expect(mocks.contactDeleteMany).toHaveBeenCalledWith({
      where: { id: "contact-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned contact is deleted", async () => {
    mocks.contactDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteContact("contact-1", "user-1");

    expect(result).toEqual({ ok: false });
  });
});
