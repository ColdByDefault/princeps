import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider, Session } from "@/tests/helpers/types";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  integrationDeleteMany: vi.fn<() => Promise<{ count: number }>>(),
  integrationFindMany: vi.fn<() => Promise<unknown[]>>(),
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

vi.mock("@/lib/core/db", () => ({
  db: {
    integration: {
      deleteMany: mocks.integrationDeleteMany,
      findMany: mocks.integrationFindMany,
    },
  },
}));

import { GET as listIntegrations } from "@/app/api/integrations/route";
import { DELETE as disconnectCalendar } from "@/app/api/integrations/google-calendar/disconnect/route";
import { DELETE as disconnectDrive } from "@/app/api/integrations/google-drive/disconnect/route";

const integrationRows = [
  {
    provider: "google_calendar",
    lastSyncedAt: "2026-05-22T08:00:00.000Z",
    expiresAt: "2026-05-22T09:00:00.000Z",
    createdAt: "2026-05-20T08:00:00.000Z",
  },
];

describe("integration routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.integrationFindMany.mockResolvedValue(integrationRows);
    mocks.integrationDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("lists integrations for the authenticated user", async () => {
    const response = await listIntegrations();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(integrationRows);
    expect(mocks.integrationFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: {
        provider: true,
        lastSyncedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns 401 when listing without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await listIntegrations();

    expect(response.status).toBe(401);
    expect(mocks.integrationFindMany).not.toHaveBeenCalled();
  });

  it("disconnects Google Calendar for the authenticated user", async () => {
    const response = await disconnectCalendar(
      new Request("http://localhost/api/integrations/google-calendar/disconnect", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.integrationDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", provider: "google_calendar" },
    });
  });

  it("disconnects Google Drive for the authenticated user", async () => {
    const response = await disconnectDrive(
      new Request("http://localhost/api/integrations/google-drive/disconnect", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.integrationDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", provider: "google_drive" },
    });
  });
});
