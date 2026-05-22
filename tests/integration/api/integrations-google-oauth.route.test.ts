import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider, Session } from "@/tests/helpers/types";

const cookieStore = {
  delete: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
};

const mocks = vi.hoisted(() => ({
  buildDriveAuthUrl: vi.fn<(state: string) => string>(),
  buildGoogleAuthUrl: vi.fn<(state: string) => string>(),
  cookies: vi.fn<() => Promise<typeof cookieStore>>(),
  exchangeGoogleCode: vi.fn(),
  exchangeGoogleDriveCode: vi.fn(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  upsertIntegration: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/platform/integrations/google-calendar/client", () => ({
  buildGoogleAuthUrl: mocks.buildGoogleAuthUrl,
  exchangeGoogleCode: mocks.exchangeGoogleCode,
}));

vi.mock("@/lib/platform/integrations/google-drive/client", () => ({
  buildDriveAuthUrl: mocks.buildDriveAuthUrl,
  exchangeGoogleDriveCode: mocks.exchangeGoogleDriveCode,
}));

vi.mock("@/lib/platform/integrations/shared/upsert", () => ({
  upsertIntegration: mocks.upsertIntegration,
}));

import { GET as calendarCallback } from "@/app/api/integrations/google-calendar/callback/route";
import { GET as calendarConnect } from "@/app/api/integrations/google-calendar/connect/route";
import { GET as driveCallback } from "@/app/api/integrations/google-drive/callback/route";
import { GET as driveConnect } from "@/app/api/integrations/google-drive/connect/route";

const expiresAt = new Date("2026-05-22T09:00:00.000Z");

describe("Google OAuth integration routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.delete.mockClear();
    cookieStore.get.mockReset();
    cookieStore.set.mockClear();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.buildGoogleAuthUrl.mockImplementation(
      (state) => `https://google.test/calendar?state=${state}`,
    );
    mocks.buildDriveAuthUrl.mockImplementation(
      (state) => `https://google.test/drive?state=${state}`,
    );
    mocks.exchangeGoogleCode.mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt,
    });
    mocks.exchangeGoogleDriveCode.mockResolvedValue({
      accessToken: "drive-access",
      refreshToken: "drive-refresh",
      expiresAt,
    });
    mocks.upsertIntegration.mockResolvedValue({});
  });

  it("starts Google Calendar OAuth and stores state in a cookie", async () => {
    const response = await calendarConnect();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "https://google.test/calendar?state=",
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "oauth_state_google",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 600, path: "/" }),
    );
    expect(mocks.buildGoogleAuthUrl).toHaveBeenCalledWith(expect.any(String));
  });

  it("starts Google Drive OAuth and stores state in a Drive cookie", async () => {
    const response = await driveConnect();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "https://google.test/drive?state=",
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "oauth_state_google_drive",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 600, path: "/" }),
    );
  });

  it("stores Google Calendar tokens after a valid callback", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "state-1" });

    const response = await calendarCallback(
      new Request(
        "http://localhost/api/integrations/google-calendar/callback?code=abc&state=state-1",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/settings?connected=google_calendar",
    );
    expect(cookieStore.delete).toHaveBeenCalledWith("oauth_state_google");
    expect(mocks.exchangeGoogleCode).toHaveBeenCalledWith("abc");
    expect(mocks.upsertIntegration).toHaveBeenCalledWith({
      userId: "user-1",
      provider: "google_calendar",
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt,
    });
  });

  it("stores Google Drive tokens after a valid callback", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "state-1" });

    const response = await driveCallback(
      new Request(
        "http://localhost/api/integrations/google-drive/callback?code=abc&state=state-1",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/settings?connected=google_drive",
    );
    expect(cookieStore.delete).toHaveBeenCalledWith(
      "oauth_state_google_drive",
    );
    expect(mocks.exchangeGoogleDriveCode).toHaveBeenCalledWith("abc");
    expect(mocks.upsertIntegration).toHaveBeenCalledWith({
      userId: "user-1",
      provider: "google_drive",
      accessToken: "drive-access",
      refreshToken: "drive-refresh",
      expiresAt,
    });
  });

  it("redirects with an error when callback state does not match", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "expected" });

    const response = await calendarCallback(
      new Request(
        "http://localhost/api/integrations/google-calendar/callback?code=abc&state=wrong",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/settings?integration_error=state_mismatch",
    );
    expect(mocks.exchangeGoogleCode).not.toHaveBeenCalled();
  });
});
