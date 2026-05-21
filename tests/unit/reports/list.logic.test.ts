import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssistantReportRecord } from "@/lib/reports/shared.logic";

type DbReportRow = {
  id: string;
  toolsCalled: unknown;
  toolCallCount: number;
  tokenUsage: number;
  details: unknown;
  createdAt: Date;
};

type AssistantReportFindManyArgs = {
  where: { userId: string };
  orderBy: { createdAt: "desc" };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  assistantReportFindMany: vi.fn<
    (args: AssistantReportFindManyArgs) => Promise<DbReportRow[]>
  >(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    assistantReport: {
      findMany: mocks.assistantReportFindMany,
    },
  },
}));

import { listReports } from "@/lib/reports/list.logic";

describe("listReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists reports scoped to the user and maps rows to client-safe records", async () => {
    mocks.assistantReportFindMany.mockResolvedValue([
      {
        id: "report-1",
        toolsCalled: ["create_task"],
        toolCallCount: 1,
        tokenUsage: 123,
        details: [
          {
            tool: "create_task",
            ok: true,
            kv: { title: "Prepare board packet" },
          },
        ],
        createdAt: new Date("2026-05-08T06:00:00.000Z"),
      },
    ]);

    const records = await listReports("user-1");

    expect(mocks.assistantReportFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      select: expect.objectContaining({ id: true, toolsCalled: true }),
    });

    const expectedRecords: AssistantReportRecord[] = [
      {
        id: "report-1",
        toolsCalled: ["create_task"],
        toolCallCount: 1,
        tokenUsage: 123,
        details: [
          {
            tool: "create_task",
            ok: true,
            kv: { title: "Prepare board packet" },
          },
        ],
        createdAt: "2026-05-08T06:00:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });
});
