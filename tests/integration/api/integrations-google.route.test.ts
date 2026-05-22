import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";


const mocks = vi.hoisted(() => ({
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  importDriveFile: vi.fn<(userId: string, fileId: string) => Promise<{ name: string }>>(),
  listDriveFiles: vi.fn<(userId: string) => Promise<unknown[]>>(),
  syncGoogleCalendar: vi.fn<(userId: string) => Promise<unknown>>(),
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

vi.mock("@/lib/platform/integrations/google-calendar/sync", () => ({
  syncGoogleCalendar: mocks.syncGoogleCalendar,
}));

vi.mock("@/lib/platform/integrations/google-drive", () => ({
  importDriveFile: mocks.importDriveFile,
  listDriveFiles: mocks.listDriveFiles,
}));

import { POST as syncCalendar } from "@/app/api/integrations/google-calendar/sync/route";
import { POST as importDrive } from "@/app/api/integrations/google-drive/import/route";
import { POST as syncDrive } from "@/app/api/integrations/google-drive/sync/route";
import { IntegrationExpiredError, IntegrationNotFoundError } from "@/lib/platform/integrations/shared/token";

describe("Google integration action routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.syncGoogleCalendar.mockResolvedValue({ created: 2, updated: 1 });
    mocks.listDriveFiles.mockResolvedValue([{ id: "file-1", name: "Plan" }]);
    mocks.importDriveFile.mockResolvedValue({ name: "Plan" });
  });

  it("syncs Google Calendar for the authenticated user", async () => {
    const response = await syncCalendar(
      new Request("http://localhost/api/integrations/google-calendar/sync", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ created: 2, updated: 1 });
    expect(mocks.syncGoogleCalendar).toHaveBeenCalledWith("user-1");
  });

  it("maps missing and expired calendar integrations to API errors", async () => {
    mocks.syncGoogleCalendar.mockRejectedValueOnce(
      new IntegrationNotFoundError("google_calendar"),
    );

    const missing = await syncCalendar(
      new Request("http://localhost/api/integrations/google-calendar/sync", {
        method: "POST",
      }),
    );

    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({ error: "Not connected" });

    mocks.syncGoogleCalendar.mockRejectedValueOnce(
      new IntegrationExpiredError("google_calendar"),
    );

    const expired = await syncCalendar(
      new Request("http://localhost/api/integrations/google-calendar/sync", {
        method: "POST",
      }),
    );

    expect(expired.status).toBe(401);
    await expect(expired.json()).resolves.toEqual({
      error: "Token expired — please reconnect",
    });
  });

  it("lists Google Drive files for the authenticated user", async () => {
    const response = await syncDrive(
      new Request("http://localhost/api/integrations/google-drive/sync", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      files: [{ id: "file-1", name: "Plan" }],
    });
    expect(mocks.listDriveFiles).toHaveBeenCalledWith("user-1");
  });

  it("imports a Google Drive file", async () => {
    const response = await importDrive(
      new Request("http://localhost/api/integrations/google-drive/import", {
        body: JSON.stringify({ fileId: "file-1" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      name: "Plan",
    });
    expect(mocks.importDriveFile).toHaveBeenCalledWith("user-1", "file-1");
  });

  it("validates Google Drive import request bodies", async () => {
    const response = await importDrive(
      new Request("http://localhost/api/integrations/google-drive/import", {
        body: JSON.stringify({ fileId: "" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "fileId is required",
    });
    expect(mocks.importDriveFile).not.toHaveBeenCalled();
  });
});
