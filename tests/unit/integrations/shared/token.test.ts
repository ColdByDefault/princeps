import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type IntegrationRow = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

type IntegrationFindUniqueArgs = {
  where: { userId_provider: { userId: string; provider: string } };
};

type IntegrationUpdateArgs = {
  where: { userId_provider: { userId: string; provider: string } };
  data: { accessToken: string; expiresAt: Date | null };
};

const mocks = vi.hoisted(() => ({
  decryptToken: vi.fn<(value: string) => string>(),
  encryptToken: vi.fn<(value: string) => string>(),
  integrationFindUnique: vi.fn<
    (args: IntegrationFindUniqueArgs) => Promise<IntegrationRow | null>
  >(),
  integrationUpdate: vi.fn<
    (args: IntegrationUpdateArgs) => Promise<unknown>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    integration: {
      findUnique: mocks.integrationFindUnique,
      update: mocks.integrationUpdate,
    },
  },
}));

vi.mock("@/lib/platform/integrations/shared/crypto", () => ({
  decryptToken: mocks.decryptToken,
  encryptToken: mocks.encryptToken,
}));

import {
  getValidToken,
  IntegrationExpiredError,
  IntegrationNotFoundError,
} from "@/lib/platform/integrations/shared/token";

describe("getValidToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));
    mocks.decryptToken.mockImplementation((value) => `plain:${value}`);
    mocks.encryptToken.mockImplementation((value) => `encrypted:${value}`);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the stored access token when it is not expiring soon", async () => {
    mocks.integrationFindUnique.mockResolvedValue({
      accessToken: "stored-access",
      refreshToken: "stored-refresh",
      expiresAt: new Date("2026-05-22T12:10:00.000Z"),
    });
    const refreshFn = vi.fn();

    const token = await getValidToken("user-1", "google_calendar", refreshFn);

    expect(mocks.integrationFindUnique).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: "user-1",
          provider: "google_calendar",
        },
      },
    });
    expect(token).toBe("plain:stored-access");
    expect(refreshFn).not.toHaveBeenCalled();
    expect(mocks.integrationUpdate).not.toHaveBeenCalled();
  });

  it("refreshes, stores, and returns a new token when the current token is expiring soon", async () => {
    const refreshedExpiresAt = new Date("2026-05-22T13:00:00.000Z");
    mocks.integrationFindUnique.mockResolvedValue({
      accessToken: "stored-access",
      refreshToken: "stored-refresh",
      expiresAt: new Date("2026-05-22T12:04:00.000Z"),
    });
    const refreshFn = vi.fn().mockResolvedValue({
      accessToken: "fresh-access",
      expiresAt: refreshedExpiresAt,
    });

    const token = await getValidToken("user-1", "google_calendar", refreshFn);

    expect(refreshFn).toHaveBeenCalledWith("plain:stored-refresh");
    expect(mocks.integrationUpdate).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: "user-1",
          provider: "google_calendar",
        },
      },
      data: {
        accessToken: "encrypted:fresh-access",
        expiresAt: refreshedExpiresAt,
      },
    });
    expect(token).toBe("fresh-access");
  });

  it("throws not found when the integration is missing", async () => {
    mocks.integrationFindUnique.mockResolvedValue(null);

    await expect(
      getValidToken("user-1", "google_calendar", vi.fn()),
    ).rejects.toBeInstanceOf(IntegrationNotFoundError);
  });

  it("throws expired when refresh is needed but unavailable or fails", async () => {
    mocks.integrationFindUnique.mockResolvedValueOnce({
      accessToken: "stored-access",
      refreshToken: null,
      expiresAt: new Date("2026-05-22T12:04:00.000Z"),
    });

    await expect(
      getValidToken("user-1", "google_calendar", vi.fn()),
    ).rejects.toBeInstanceOf(IntegrationExpiredError);

    mocks.integrationFindUnique.mockResolvedValueOnce({
      accessToken: "stored-access",
      refreshToken: "stored-refresh",
      expiresAt: new Date("2026-05-22T12:04:00.000Z"),
    });

    await expect(
      getValidToken(
        "user-1",
        "google_calendar",
        vi.fn().mockRejectedValue(new Error("refresh failed")),
      ),
    ).rejects.toBeInstanceOf(IntegrationExpiredError);
  });
});
