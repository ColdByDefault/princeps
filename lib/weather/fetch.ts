/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { getCoordsForTimezone } from "./timezone-coords";
import { getCoordsForLocation } from "./location-coords";

export interface WeatherSnapshot {
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
  conditionEmoji: string;
  location: string;
}

/**
 * WMO Weather Interpretation Codes → human-readable label + emoji.
 * Reference: https://open-meteo.com/en/docs#weathervariables
 */
const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Foggy", emoji: "🌫️" },
  48: { label: "Icy fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Moderate drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  56: { label: "Freezing drizzle", emoji: "🌨️" },
  57: { label: "Heavy freezing drizzle", emoji: "🌨️" },
  61: { label: "Light rain", emoji: "🌧️" },
  63: { label: "Moderate rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  66: { label: "Light freezing rain", emoji: "🌨️" },
  67: { label: "Heavy freezing rain", emoji: "🌨️" },
  71: { label: "Light snow", emoji: "❄️" },
  73: { label: "Moderate snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  77: { label: "Snow grains", emoji: "🌨️" },
  80: { label: "Light showers", emoji: "🌦️" },
  81: { label: "Moderate showers", emoji: "🌧️" },
  82: { label: "Heavy showers", emoji: "⛈️" },
  85: { label: "Snow showers", emoji: "❄️" },
  86: { label: "Heavy snow showers", emoji: "❄️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm with hail", emoji: "⛈️" },
  99: { label: "Thunderstorm with heavy hail", emoji: "⛈️" },
};

const FALLBACK_CONDITION = { label: "Unknown", emoji: "🌡️" };

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weathercode: number;
  };
}

/**
 * Fetches current weather from Open-Meteo.
 * Prefers `locationKey` (city-level precision) when provided; falls back to
 * deriving coords from the user's IANA `timezone`.
 * No user IP or identifier is ever sent externally.
 * Returns null on any network or parse error (weather is non-critical).
 */
export async function fetchWeather(
  timezone: string,
  locationKey?: string | null,
): Promise<WeatherSnapshot | null> {
  const coords = locationKey
    ? getCoordsForLocation(locationKey)
    : getCoordsForTimezone(timezone);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set("current", "temperature_2m,weathercode");
  url.searchParams.set("forecast_days", "1");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // cache 30 min at the CDN/Next layer
    });

    if (!res.ok) return null;

    const data = (await res.json()) as OpenMeteoResponse;
    const temp = data.current.temperature_2m;
    const code = data.current.weathercode;
    const condition = WMO_CODES[code] ?? FALLBACK_CONDITION;

    return {
      temperatureCelsius: Math.round(temp),
      weatherCode: code,
      conditionLabel: condition.label,
      conditionEmoji: condition.emoji,
      location: coords.label,
    };
  } catch {
    return null;
  }
}
