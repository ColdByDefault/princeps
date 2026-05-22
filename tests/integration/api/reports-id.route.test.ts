import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";

type DeleteReport = (userId: string, reportId: string) => Promise<boolean>;

const mocks = vi.hoisted(() => ({
  deleteReport: vi.fn<DeleteReport>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
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
  deleteReport: mocks.deleteReport,
}));

import { DELETE } from "@/app/api/reports/[id]/route";

function params(id = "report-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/reports/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.deleteReport.mockResolvedValue(true);
  });

  it("deletes one authenticated user report", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/reports/report-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.deleteReport).toHaveBeenCalledWith("user-1", "report-1");
  });

  it("returns 404 when deleting a missing or unowned report", async () => {
    mocks.deleteReport.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost/api/reports/report-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/reports/report-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(401);
    expect(mocks.deleteReport).not.toHaveBeenCalled();
  });
});
