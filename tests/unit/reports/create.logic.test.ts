import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateReportInput } from "@/lib/features/reports/schemas";
import type { AssistantReportRecord } from "@/lib/features/reports/shared.logic";

type DbReportRow = {
  id: string;
  toolsCalled: unknown;
  toolCallCount: number;
  tokenUsage: number;
  details: unknown;
  createdAt: Date;
};

type AssistantReportCreateArgs = {
  data: {
    userId: string;
    toolsCalled: unknown;
    toolCallCount: number;
    tokenUsage: number;
    details: unknown;
  };
  select: unknown;
};

type NotificationCreateArgs = {
  data: {
    userId: string;
    category: string;
    source: string;
    title: string;
    body: string;
    metadata: { reportId: string };
  };
};

const mocks = vi.hoisted(() => ({
  assistantReportCreate: vi.fn<
    (args: AssistantReportCreateArgs) => Promise<DbReportRow>
  >(),
  notificationCreate: vi.fn<
    (args: NotificationCreateArgs) => Promise<unknown>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    assistantReport: {
      create: mocks.assistantReportCreate,
    },
    notification: {
      create: mocks.notificationCreate,
    },
  },
}));

import { createReport } from "@/lib/features/reports/create.logic";

describe("createReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notificationCreate.mockResolvedValue({});
  });

  it("validates, persists, maps, and emits a report notification", async () => {
    const input: CreateReportInput = {
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
    };
    mocks.assistantReportCreate.mockResolvedValue({
      id: "report-1",
      toolsCalled: input.toolsCalled,
      toolCallCount: input.toolCallCount,
      tokenUsage: input.tokenUsage,
      details: input.details,
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
    });

    const record = await createReport("user-1", input);

    expect(mocks.assistantReportCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        toolsCalled: ["create_task"],
        toolCallCount: 1,
        tokenUsage: 123,
        details: input.details,
      },
      select: expect.objectContaining({ id: true, toolsCalled: true }),
    });

    const expectedRecord: AssistantReportRecord = {
      id: "report-1",
      toolsCalled: ["create_task"],
      toolCallCount: 1,
      tokenUsage: 123,
      details: input.details,
      createdAt: "2026-05-08T06:00:00.000Z",
    };
    expect(record).toEqual(expectedRecord);

    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        category: "report_generated",
        source: "system",
        title: "Report generated",
        metadata: { reportId: "report-1" },
      }),
    });
    const notificationBody = mocks.notificationCreate.mock.calls[0]?.[0].data.body;
    expect(notificationBody).toContain("1 tool called");
    expect(notificationBody).toContain("123 tokens used");
  });

  it("returns null and skips persistence when validation fails", async () => {
    const record = await createReport("user-1", {
      toolsCalled: ["create_task"],
      toolCallCount: -1,
      tokenUsage: 123,
      details: [],
    } as CreateReportInput);

    expect(record).toBeNull();
    expect(mocks.assistantReportCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it("falls back to safe arrays when stored JSON fields are malformed", async () => {
    mocks.assistantReportCreate.mockResolvedValue({
      id: "report-1",
      toolsCalled: null,
      toolCallCount: 0,
      tokenUsage: 0,
      details: null,
      createdAt: new Date("2026-05-08T06:00:00.000Z"),
    });

    const record = await createReport("user-1", {
      toolsCalled: [],
      toolCallCount: 0,
      tokenUsage: 0,
      details: [],
    });

    expect(record).toMatchObject({
      toolsCalled: [],
      details: [],
    });
  });
});
