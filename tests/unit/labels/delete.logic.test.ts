import { beforeEach, describe, expect, it, vi } from "vitest";

type LabelDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  labelDeleteMany: vi.fn<
    (args: LabelDeleteManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    label: {
      deleteMany: mocks.labelDeleteMany,
    },
  },
}));

import { deleteLabel } from "@/lib/features/labels/delete.logic";

describe("deleteLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a user-owned label", async () => {
    mocks.labelDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteLabel("label-1", "user-1");

    expect(mocks.labelDeleteMany).toHaveBeenCalledWith({
      where: { id: "label-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned label is deleted", async () => {
    mocks.labelDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteLabel("label-1", "user-1");

    expect(result).toEqual({ ok: false });
  });
});
