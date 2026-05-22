import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BriefingRecord } from "@/types/api";

type BriefingFindUniqueArgs = {
  where: { userId: string };
  select: { id: true; content: true; generatedAt: true };
};

const mocks = vi.hoisted(() => ({
  briefingFindUnique: vi.fn<
    (
      args: BriefingFindUniqueArgs,
    ) => Promise<{ id: string; content: string; generatedAt: Date } | null>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    briefingCache: {
      findUnique: mocks.briefingFindUnique,
    },
  },
}));

import { getBriefing } from "@/lib/features/briefings/get.logic";

describe("getBriefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the cached user briefing as a client-safe record", async () => {
    mocks.briefingFindUnique.mockResolvedValue({
      id: "briefing-1",
      content: "## Daily briefing",
      generatedAt: new Date("2026-05-22T06:00:00.000Z"),
    });

    const briefing = await getBriefing("user-1");

    expect(mocks.briefingFindUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true, content: true, generatedAt: true },
    });
    const expectedBriefing: BriefingRecord = {
      id: "briefing-1",
      content: "## Daily briefing",
      generatedAt: "2026-05-22T06:00:00.000Z",
    };
    expect(briefing).toEqual(expectedBriefing);
  });

  it("returns null when no briefing exists", async () => {
    mocks.briefingFindUnique.mockResolvedValue(null);

    await expect(getBriefing("user-1")).resolves.toBeNull();
  });
});
