import { beforeEach, describe, expect, it, vi } from "vitest";

type AssistantReportDeleteManyArgs = {
  where: {
    id?: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  assistantReportDeleteMany: vi.fn<
    (args: AssistantReportDeleteManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    assistantReport: {
      deleteMany: mocks.assistantReportDeleteMany,
    },
  },
}));

import { deleteAllReports, deleteReport } from "@/lib/features/reports/delete.logic";

describe("report delete logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only one user-owned report", async () => {
    mocks.assistantReportDeleteMany.mockResolvedValue({ count: 1 });

    const deleted = await deleteReport("user-1", "report-1");

    expect(mocks.assistantReportDeleteMany).toHaveBeenCalledWith({
      where: { id: "report-1", userId: "user-1" },
    });
    expect(deleted).toBe(true);
  });

  it("returns false when one report is missing or not user-owned", async () => {
    mocks.assistantReportDeleteMany.mockResolvedValue({ count: 0 });

    const deleted = await deleteReport("user-1", "report-1");

    expect(deleted).toBe(false);
  });

  it("deletes all user-owned reports and returns the count", async () => {
    mocks.assistantReportDeleteMany.mockResolvedValue({ count: 3 });

    const count = await deleteAllReports("user-1");

    expect(mocks.assistantReportDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(count).toBe(3);
  });
});
