import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderStatusPayload } from "@/types/llm";
import type { GetSession, HeadersProvider, Session } from "@/tests/helpers/types";

const providerStatus: ProviderStatusPayload = {
  active: "openAi",
  activeModel: "gpt-4o-mini",
  providers: [
    {
      provider: "openAi",
      health: {
        connected: true,
        version: null,
        models: [],
        error: null,
      },
    },
  ],
};

const mocks = vi.hoisted(() => ({
  getProviderStatus: vi.fn<() => Promise<ProviderStatusPayload>>(),
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

vi.mock("@/lib/platform/settings", () => ({
  getProviderStatus: mocks.getProviderStatus,
}));

import { GET } from "@/app/api/settings/provider-status/route";

describe("/api/settings/provider-status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getProviderStatus.mockResolvedValue(providerStatus);
  });

  it("returns provider status for the authenticated user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(providerStatus);
    expect(mocks.getProviderStatus).toHaveBeenCalledTimes(1);
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getProviderStatus).not.toHaveBeenCalled();
  });
});
