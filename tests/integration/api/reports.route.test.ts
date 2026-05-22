import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssistantReportRecord } from "@/lib/features/reports/shared.logic";
import type { GetSession, HeadersProvider, Session } from "@/tests/helpers/types";

type ListReports = (userId: string) => Promise<AssistantReportRecord[]>;
type DeleteAllReports = (userId: string) => Promise<number>;

const mocks = vi.hoisted(() => ({
  deleteAllReports: vi.fn<DeleteAllReports>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listReports: vi.fn<ListReports>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/features/reports", () => ({
  deleteAllReports: mocks.deleteAllReports,
  listReports: mocks.listReports,
}));

import { DELETE, GET } from "@/app/api/reports/route";

const reportRecord: AssistantReportRecord = {
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
};

describe("/api/reports route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listReports.mockResolvedValue([reportRecord]);
    mocks.deleteAllReports.mockResolvedValue(3);
  });

  it("lists authenticated user reports", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reports: [reportRecord],
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listReports).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 when listing without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.listReports).not.toHaveBeenCalled();
  });

  it("deletes all reports for the authenticated user", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: 3 });
    expect(mocks.deleteAllReports).toHaveBeenCalledWith("user-1");
  });
});
