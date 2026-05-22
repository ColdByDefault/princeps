import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LabelRecord } from "@/types/api";

type DbLabelRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LabelCreateArgs = {
  data: {
    userId: string;
    name: string;
    color: string;
    icon: string | null;
    normalizedName: string;
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  labelCreate: vi.fn<(args: LabelCreateArgs) => Promise<DbLabelRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    label: {
      create: mocks.labelCreate,
    },
  },
}));

import { createLabel } from "@/lib/features/labels/create.logic";

describe("createLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trims label data, stores a normalized name, and maps the result", async () => {
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    mocks.labelCreate.mockResolvedValue({
      id: "label-1",
      name: "Board",
      color: "#0f766e",
      icon: "Tag",
      createdAt,
      updatedAt,
    });

    const result = await createLabel("user-1", {
      name: "  Board  ",
      color: "#0f766e",
      icon: "Tag",
    });

    expect(mocks.labelCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Board",
        color: "#0f766e",
        icon: "Tag",
        normalizedName: "board",
      },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedLabel: LabelRecord = {
      id: "label-1",
      name: "Board",
      color: "#0f766e",
      icon: "Tag",
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(result).toEqual({ ok: true, label: expectedLabel });
  });

  it("uses default color and null icon when omitted", async () => {
    mocks.labelCreate.mockResolvedValue({
      id: "label-1",
      name: "Board",
      color: "#6366f1",
      icon: null,
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
    });

    await createLabel("user-1", { name: "Board" });

    expect(mocks.labelCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Board",
        color: "#6366f1",
        icon: null,
        normalizedName: "board",
      },
      select: expect.objectContaining({ id: true, name: true }),
    });
  });

  it("returns duplicate when Prisma reports a unique constraint conflict", async () => {
    mocks.labelCreate.mockRejectedValue({ code: "P2002" });

    const result = await createLabel("user-1", { name: "Board" });

    expect(result).toEqual({ ok: false, duplicate: true });
  });

  it("returns a generic create error for unexpected failures", async () => {
    mocks.labelCreate.mockRejectedValue(new Error("database unavailable"));

    const result = await createLabel("user-1", { name: "Board" });

    expect(result).toEqual({
      ok: false,
      duplicate: false,
      error: "Failed to create label",
    });
  });
});
