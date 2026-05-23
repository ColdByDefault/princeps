import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getResetLinks: vi.fn<() => string[]>(),
}));

vi.mock("@/lib/core/dev/reset-mailbox", () => ({
  getResetLinks: mocks.getResetLinks,
}));

import { GET } from "@/app/api/dev/reset-links/route";

describe("/api/dev/reset-links route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 404 outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET();

    expect(response.status).toBe(404);
    expect(mocks.getResetLinks).not.toHaveBeenCalled();
  });

  it("returns reset links in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.getResetLinks.mockReturnValue(["https://app.test/reset"]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      links: ["https://app.test/reset"],
    });
  });
});
