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

type LabelFindManyArgs = {
  where: { userId: string };
  orderBy: { createdAt: "asc" };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  labelFindMany: vi.fn<(args: LabelFindManyArgs) => Promise<DbLabelRow[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    label: {
      findMany: mocks.labelFindMany,
    },
  },
}));

import { listLabels } from "@/lib/features/labels/list.logic";

describe("listLabels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists labels scoped to the user and maps rows to client-safe records", async () => {
    mocks.labelFindMany.mockResolvedValue([
      {
        id: "label-1",
        name: "Board",
        color: "#0f766e",
        icon: "Tag",
        createdAt: new Date("2026-05-08T06:00:00.000Z"),
        updatedAt: new Date("2026-05-08T06:30:00.000Z"),
      },
    ]);

    const records = await listLabels("user-1");

    expect(mocks.labelFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "asc" },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedRecords: LabelRecord[] = [
      {
        id: "label-1",
        name: "Board",
        color: "#0f766e",
        icon: "Tag",
        createdAt: "2026-05-08T06:00:00.000Z",
        updatedAt: "2026-05-08T06:30:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });
});
