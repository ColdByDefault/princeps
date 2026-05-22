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

type LabelUpdateArgs = {
  where: { id: string; userId: string };
  data: Record<string, unknown>;
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  labelUpdate: vi.fn<(args: LabelUpdateArgs) => Promise<DbLabelRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    label: {
      update: mocks.labelUpdate,
    },
  },
}));

import { updateLabel } from "@/lib/features/labels/update.logic";

describe("updateLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a user-scoped label, normalizes renamed labels, and maps the result", async () => {
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    mocks.labelUpdate.mockResolvedValue({
      id: "label-1",
      name: "Board",
      color: "#2563eb",
      icon: null,
      createdAt,
      updatedAt,
    });

    const result = await updateLabel("label-1", "user-1", {
      name: "  Board  ",
      color: "#2563eb",
      icon: null,
    });

    expect(mocks.labelUpdate).toHaveBeenCalledWith({
      where: { id: "label-1", userId: "user-1" },
      data: {
        name: "Board",
        normalizedName: "board",
        color: "#2563eb",
        icon: null,
      },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedLabel: LabelRecord = {
      id: "label-1",
      name: "Board",
      color: "#2563eb",
      icon: null,
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(result).toEqual({ ok: true, label: expectedLabel });
  });

  it("updates only supplied fields", async () => {
    mocks.labelUpdate.mockResolvedValue({
      id: "label-1",
      name: "Board",
      color: "#2563eb",
      icon: "Tag",
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
      updatedAt: new Date("2026-05-08T06:30:00.000Z"),
    });

    await updateLabel("label-1", "user-1", {
      color: "#2563eb",
    });

    const updateArgs = mocks.labelUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data).toEqual({ color: "#2563eb" });
  });

  it("returns notFound when Prisma reports a missing label", async () => {
    mocks.labelUpdate.mockRejectedValue({ code: "P2025" });

    const result = await updateLabel("label-1", "user-1", {
      name: "Board",
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });

  it("returns duplicate when Prisma reports a unique constraint conflict", async () => {
    mocks.labelUpdate.mockRejectedValue({ code: "P2002" });

    const result = await updateLabel("label-1", "user-1", {
      name: "Board",
    });

    expect(result).toEqual({
      ok: false,
      notFound: false,
      duplicate: true,
    });
  });

  it("returns a generic update error for unexpected failures", async () => {
    mocks.labelUpdate.mockRejectedValue(new Error("database unavailable"));

    const result = await updateLabel("label-1", "user-1", {
      name: "Board",
    });

    expect(result).toEqual({
      ok: false,
      notFound: false,
      duplicate: false,
      error: "Failed to update label",
    });
  });
});
