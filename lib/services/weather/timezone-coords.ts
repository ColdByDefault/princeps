/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

export interface TimezoneCoords {
  lat: number;
  lon: number;
  label: string;
}

/**
 * Static map of IANA timezone → approximate city coordinates.
 * Used server-side to derive a weather location without collecting user data.
 * Falls back to geographic center of Germany when timezone is unknown.
 */
export const TIMEZONE_COORDS: Record<string, TimezoneCoords> = {
  // Europe
  "Europe/Berlin": { lat: 52.52, lon: 13.41, label: "Berlin" },
  "Europe/Vienna": { lat: 48.21, lon: 16.37, label: "Vienna" },
  "Europe/Zurich": { lat: 47.38, lon: 8.54, label: "Zurich" },
  "Europe/London": { lat: 51.51, lon: -0.13, label: "London" },
  "Europe/Paris": { lat: 48.85, lon: 2.35, label: "Paris" },
  "Europe/Amsterdam": { lat: 52.37, lon: 4.9, label: "Amsterdam" },
  "Europe/Brussels": { lat: 50.85, lon: 4.35, label: "Brussels" },
  "Europe/Madrid": { lat: 40.42, lon: -3.7, label: "Madrid" },
  "Europe/Rome": { lat: 41.9, lon: 12.49, label: "Rome" },
  "Europe/Warsaw": { lat: 52.23, lon: 21.01, label: "Warsaw" },
  "Europe/Prague": { lat: 50.08, lon: 14.44, label: "Prague" },
  "Europe/Budapest": { lat: 47.5, lon: 19.04, label: "Budapest" },
  "Europe/Bucharest": { lat: 44.43, lon: 26.1, label: "Bucharest" },
  "Europe/Sofia": { lat: 42.7, lon: 23.32, label: "Sofia" },
  "Europe/Athens": { lat: 37.98, lon: 23.73, label: "Athens" },
  "Europe/Lisbon": { lat: 38.72, lon: -9.14, label: "Lisbon" },
  "Europe/Stockholm": { lat: 59.33, lon: 18.07, label: "Stockholm" },
  "Europe/Oslo": { lat: 59.91, lon: 10.75, label: "Oslo" },
  "Europe/Copenhagen": { lat: 55.68, lon: 12.57, label: "Copenhagen" },
  "Europe/Helsinki": { lat: 60.17, lon: 24.94, label: "Helsinki" },
  "Europe/Dublin": { lat: 53.33, lon: -6.25, label: "Dublin" },
  "Europe/Moscow": { lat: 55.75, lon: 37.62, label: "Moscow" },
  "Europe/Istanbul": { lat: 41.01, lon: 28.95, label: "Istanbul" },
  "Europe/Kiev": { lat: 50.45, lon: 30.52, label: "Kyiv" },
  "Europe/Kyiv": { lat: 50.45, lon: 30.52, label: "Kyiv" },
  "Europe/Minsk": { lat: 53.9, lon: 27.57, label: "Minsk" },
  "Europe/Riga": { lat: 56.95, lon: 24.11, label: "Riga" },
  "Europe/Vilnius": { lat: 54.69, lon: 25.28, label: "Vilnius" },
  "Europe/Tallinn": { lat: 59.44, lon: 24.75, label: "Tallinn" },
  "Europe/Zagreb": { lat: 45.81, lon: 15.98, label: "Zagreb" },
  "Europe/Ljubljana": { lat: 46.05, lon: 14.51, label: "Ljubljana" },
  "Europe/Bratislava": { lat: 48.15, lon: 17.11, label: "Bratislava" },
  "Europe/Skopje": { lat: 42.0, lon: 21.43, label: "Skopje" },
  "Europe/Belgrade": { lat: 44.82, lon: 20.46, label: "Belgrade" },
  "Europe/Sarajevo": { lat: 43.85, lon: 18.36, label: "Sarajevo" },
  "Europe/Podgorica": { lat: 42.44, lon: 19.26, label: "Podgorica" },
  "Europe/Tirane": { lat: 41.33, lon: 19.82, label: "Tirana" },
  "Europe/Nicosia": { lat: 35.17, lon: 33.37, label: "Nicosia" },
  "Europe/Luxembourg": { lat: 49.61, lon: 6.13, label: "Luxembourg" },
  "Europe/Malta": { lat: 35.9, lon: 14.51, label: "Malta" },

  // Americas
  "America/New_York": { lat: 40.71, lon: -74.01, label: "New York" },
  "America/Chicago": { lat: 41.85, lon: -87.65, label: "Chicago" },
  "America/Denver": { lat: 39.74, lon: -104.98, label: "Denver" },
  "America/Los_Angeles": { lat: 34.05, lon: -118.24, label: "Los Angeles" },
  "America/Phoenix": { lat: 33.45, lon: -112.07, label: "Phoenix" },
  "America/Anchorage": { lat: 61.22, lon: -149.9, label: "Anchorage" },
  "America/Honolulu": { lat: 21.31, lon: -157.86, label: "Honolulu" },
  "America/Toronto": { lat: 43.65, lon: -79.38, label: "Toronto" },
  "America/Vancouver": { lat: 49.25, lon: -123.12, label: "Vancouver" },
  "America/Montreal": { lat: 45.5, lon: -73.57, label: "Montreal" },
  "America/Sao_Paulo": { lat: -23.55, lon: -46.63, label: "São Paulo" },
  "America/Buenos_Aires": { lat: -34.6, lon: -58.38, label: "Buenos Aires" },
  "America/Santiago": { lat: -33.46, lon: -70.65, label: "Santiago" },
  "America/Bogota": { lat: 4.71, lon: -74.07, label: "Bogotá" },
  "America/Lima": { lat: -12.05, lon: -77.04, label: "Lima" },
  "America/Mexico_City": { lat: 19.43, lon: -99.13, label: "Mexico City" },
  "America/Caracas": { lat: 10.48, lon: -66.88, label: "Caracas" },

  // Asia
  "Asia/Tokyo": { lat: 35.69, lon: 139.69, label: "Tokyo" },
  "Asia/Shanghai": { lat: 31.23, lon: 121.47, label: "Shanghai" },
  "Asia/Beijing": { lat: 39.91, lon: 116.39, label: "Beijing" },
  "Asia/Hong_Kong": { lat: 22.32, lon: 114.16, label: "Hong Kong" },
  "Asia/Singapore": { lat: 1.29, lon: 103.85, label: "Singapore" },
  "Asia/Seoul": { lat: 37.57, lon: 126.98, label: "Seoul" },
  "Asia/Kolkata": { lat: 22.57, lon: 88.36, label: "Kolkata" },
  "Asia/Mumbai": { lat: 19.08, lon: 72.88, label: "Mumbai" },
  "Asia/Dubai": { lat: 25.2, lon: 55.27, label: "Dubai" },
  "Asia/Riyadh": { lat: 24.69, lon: 46.72, label: "Riyadh" },
  "Asia/Tehran": { lat: 35.69, lon: 51.42, label: "Tehran" },
  "Asia/Baghdad": { lat: 33.34, lon: 44.4, label: "Baghdad" },
  "Asia/Karachi": { lat: 24.86, lon: 67.01, label: "Karachi" },
  "Asia/Dhaka": { lat: 23.72, lon: 90.41, label: "Dhaka" },
  "Asia/Colombo": { lat: 6.93, lon: 79.86, label: "Colombo" },
  "Asia/Rangoon": { lat: 16.87, lon: 96.19, label: "Yangon" },
  "Asia/Yangon": { lat: 16.87, lon: 96.19, label: "Yangon" },
  "Asia/Bangkok": { lat: 13.75, lon: 100.52, label: "Bangkok" },
  "Asia/Jakarta": { lat: -6.21, lon: 106.85, label: "Jakarta" },
  "Asia/Manila": { lat: 14.6, lon: 120.98, label: "Manila" },
  "Asia/Taipei": { lat: 25.05, lon: 121.57, label: "Taipei" },
  "Asia/Kuala_Lumpur": { lat: 3.15, lon: 101.69, label: "Kuala Lumpur" },
  "Asia/Almaty": { lat: 43.25, lon: 76.95, label: "Almaty" },
  "Asia/Tashkent": { lat: 41.3, lon: 69.27, label: "Tashkent" },
  "Asia/Baku": { lat: 40.41, lon: 49.87, label: "Baku" },
  "Asia/Tbilisi": { lat: 41.69, lon: 44.83, label: "Tbilisi" },
  "Asia/Yerevan": { lat: 40.18, lon: 44.51, label: "Yerevan" },
  "Asia/Nicosia": { lat: 35.17, lon: 33.37, label: "Nicosia" },
  "Asia/Beirut": { lat: 33.89, lon: 35.5, label: "Beirut" },
  "Asia/Jerusalem": { lat: 31.78, lon: 35.22, label: "Jerusalem" },
  "Asia/Amman": { lat: 31.95, lon: 35.93, label: "Amman" },
  "Asia/Kuwait": { lat: 29.37, lon: 47.98, label: "Kuwait City" },
  "Asia/Muscat": { lat: 23.61, lon: 58.59, label: "Muscat" },

  // Africa
  "Africa/Cairo": { lat: 30.06, lon: 31.25, label: "Cairo" },
  "Africa/Lagos": { lat: 6.45, lon: 3.47, label: "Lagos" },
  "Africa/Nairobi": { lat: -1.29, lon: 36.82, label: "Nairobi" },
  "Africa/Johannesburg": { lat: -26.2, lon: 28.04, label: "Johannesburg" },
  "Africa/Casablanca": { lat: 33.59, lon: -7.62, label: "Casablanca" },
  "Africa/Accra": { lat: 5.55, lon: -0.2, label: "Accra" },
  "Africa/Addis_Ababa": { lat: 9.03, lon: 38.74, label: "Addis Ababa" },
  "Africa/Dar_es_Salaam": { lat: -6.79, lon: 39.21, label: "Dar es Salaam" },
  "Africa/Khartoum": { lat: 15.55, lon: 32.53, label: "Khartoum" },
  "Africa/Algiers": { lat: 36.74, lon: 3.06, label: "Algiers" },
  "Africa/Tunis": { lat: 36.82, lon: 10.17, label: "Tunis" },
  "Africa/Tripoli": { lat: 32.9, lon: 13.18, label: "Tripoli" },
  "Africa/Kampala": { lat: 0.32, lon: 32.58, label: "Kampala" },
  "Africa/Dakar": { lat: 14.69, lon: -17.44, label: "Dakar" },

  // Oceania
  "Australia/Sydney": { lat: -33.87, lon: 151.21, label: "Sydney" },
  "Australia/Melbourne": { lat: -37.81, lon: 144.96, label: "Melbourne" },
  "Australia/Perth": { lat: -31.95, lon: 115.86, label: "Perth" },
  "Australia/Brisbane": { lat: -27.47, lon: 153.03, label: "Brisbane" },
  "Australia/Adelaide": { lat: -34.93, lon: 138.6, label: "Adelaide" },
  "Pacific/Auckland": { lat: -36.87, lon: 174.77, label: "Auckland" },
  "Pacific/Fiji": { lat: -18.14, lon: 178.44, label: "Fiji" },
};

/** Default fallback: geographic center of Germany (default locale). */
const DEFAULT_COORDS: TimezoneCoords = {
  lat: 51.5,
  lon: 10.0,
  label: "Germany",
};

export function getCoordsForTimezone(timezone: string): TimezoneCoords {
  return TIMEZONE_COORDS[timezone] ?? DEFAULT_COORDS;
}
