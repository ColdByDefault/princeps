import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWeather } from "@/lib/services/weather/fetch";

const fetchMock = vi.fn<typeof fetch>();

describe("fetchWeather", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches weather for explicit location coordinates", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 21.6, weathercode: 1 },
        }),
      ),
    );

    const result = await fetchWeather("Europe/Paris", {
      label: "Paris",
      lat: 48.8566,
      lon: 2.3522,
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("latitude=48.8566");
    expect(String(url)).toContain("longitude=2.3522");
    expect(init).toEqual({ next: { revalidate: 1800 } });
    expect(result).toMatchObject({
      temperatureCelsius: 22,
      weatherCode: 1,
      conditionLabel: "Mainly clear",
      location: "Paris",
    });
  });

  it("falls back to timezone coordinates when no location is provided", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 10.2, weathercode: 999 },
        }),
      ),
    );

    const result = await fetchWeather("Europe/Berlin");

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("latitude=");
    expect(result).toMatchObject({
      temperatureCelsius: 10,
      weatherCode: 999,
      conditionLabel: "Unknown",
    });
  });

  it("returns null when the weather request fails", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(fetchWeather("Europe/Paris")).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("network failed"));

    await expect(fetchWeather("Europe/Paris")).resolves.toBeNull();
  });
});
