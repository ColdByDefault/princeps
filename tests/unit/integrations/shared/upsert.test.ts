import { beforeEach, describe, expect, it, vi } from "vitest";

type IntegrationUpsertArgs = {
  where: { userId_provider: { userId: string; provider: string } };
  create: {
    userId: string;
    provider: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  };
  update: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  };
};

type IntegrationUpdateArgs = {
  where: { userId_provider: { userId: string; provider: string } };
  data: { lastSyncedAt: Date };
};

const mocks = vi.hoisted(() => ({
  encryptToken: vi.fn<(value: string) => string>(),
  integrationUpdate: vi.fn<(args: IntegrationUpdateArgs) => Promise<unknown>>(),
  integrationUpsert: vi.fn<(args: IntegrationUpsertArgs) => Promise<unknown>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    integration: {
      update: mocks.integrationUpdate,
      upsert: mocks.integrationUpsert,
    },
  },
}));

vi.mock("@/lib/platform/integrations/shared/crypto", () => ({
  encryptToken: mocks.encryptToken,
}));

import {
  markSynced,
  upsertIntegration,
} from "@/lib/platform/integrations/shared/upsert";

describe("integration upsert helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.encryptToken.mockImplementation((value) => `encrypted:${value}`);
  });

  it("upserts encrypted integration tokens for a provider", async () => {
    const expiresAt = new Date("2026-05-22T13:00:00.000Z");

    await upsertIntegration({
      userId: "user-1",
      provider: "google_calendar",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt,
    });

    expect(mocks.integrationUpsert).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: "user-1",
          provider: "google_calendar",
        },
      },
      create: {
        userId: "user-1",
        provider: "google_calendar",
        accessToken: "encrypted:access-token",
        refreshToken: "encrypted:refresh-token",
        expiresAt,
      },
      update: {
        accessToken: "encrypted:access-token",
        refreshToken: "encrypted:refresh-token",
        expiresAt,
      },
    });
  });

  it("stores null refresh tokens and expiry when omitted", async () => {
    await upsertIntegration({
      userId: "user-1",
      provider: "google_drive",
      accessToken: "access-token",
    });

    const args = mocks.integrationUpsert.mock.calls[0]?.[0];
    expect(args?.create.refreshToken).toBeNull();
    expect(args?.create.expiresAt).toBeNull();
    expect(args?.update.refreshToken).toBeNull();
    expect(args?.update.expiresAt).toBeNull();
  });

  it("updates lastSyncedAt for a connected provider", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));

    await markSynced("user-1", "google_calendar");

    expect(mocks.integrationUpdate).toHaveBeenCalledWith({
      where: {
        userId_provider: {
          userId: "user-1",
          provider: "google_calendar",
        },
      },
      data: { lastSyncedAt: new Date("2026-05-22T12:00:00.000Z") },
    });

    vi.useRealTimers();
  });
});
