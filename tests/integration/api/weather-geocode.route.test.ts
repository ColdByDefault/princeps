import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider, Session } from "@/tests/helpers/types";

const fetchMock = vi.fn<typeof fetch>();

const mocks = vi.hoisted(() => ({
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

import { GET } from "@/app/api/weather/geocode/route";

describe("/api/weather/geocode route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1,
              name: "Paris",
              country: "France",
              admin1: "Ile-de-France",
              latitude: 48.8566,
              longitude: 2.3522,
            },
          ],
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/weather/geocode?q=Paris"),
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty results for too-short or unsafe queries", async () => {
    const shortResponse = await GET(
      new Request("http://localhost/api/weather/geocode?q=P"),
    );
    const unsafeResponse = await GET(
      new Request("http://localhost/api/weather/geocode?q=Paris<script>"),
    );

    await expect(shortResponse.json()).resolves.toEqual({ results: [] });
    await expect(unsafeResponse.json()).resolves.toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies and normalizes Open-Meteo geocode results", async () => {
    const response = await GET(
      new Request("http://localhost/api/weather/geocode?q=Paris"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          id: 1,
          name: "Paris",
          country: "France",
          admin1: "Ile-de-France",
          latitude: 48.8566,
          longitude: 2.3522,
        },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("name=Paris");
    expect(String(url)).toContain("count=8");
    expect(init).toEqual({ next: { revalidate: 3600 } });
  });

  it("returns empty results when the provider fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));

    const response = await GET(
      new Request("http://localhost/api/weather/geocode?q=Paris"),
    );

    await expect(response.json()).resolves.toEqual({ results: [] });
  });
});
