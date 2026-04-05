/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

/**
 * Client-safe timezone option list.
 * Contains only IANA keys, display labels, and region groups — no coordinates.
 * Safe to import in client components and shared bundles.
 */
export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // Europe
  { value: "Europe/Berlin", label: "Berlin", region: "Europe" },
  { value: "Europe/Vienna", label: "Vienna", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich", region: "Europe" },
  { value: "Europe/London", label: "London", region: "Europe" },
  { value: "Europe/Paris", label: "Paris", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam", region: "Europe" },
  { value: "Europe/Brussels", label: "Brussels", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid", region: "Europe" },
  { value: "Europe/Rome", label: "Rome", region: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", region: "Europe" },
  { value: "Europe/Prague", label: "Prague", region: "Europe" },
  { value: "Europe/Budapest", label: "Budapest", region: "Europe" },
  { value: "Europe/Bucharest", label: "Bucharest", region: "Europe" },
  { value: "Europe/Sofia", label: "Sofia", region: "Europe" },
  { value: "Europe/Athens", label: "Athens", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbon", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", region: "Europe" },
  { value: "Europe/Oslo", label: "Oslo", region: "Europe" },
  { value: "Europe/Copenhagen", label: "Copenhagen", region: "Europe" },
  { value: "Europe/Helsinki", label: "Helsinki", region: "Europe" },
  { value: "Europe/Dublin", label: "Dublin", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow", region: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul", region: "Europe" },
  { value: "Europe/Kyiv", label: "Kyiv", region: "Europe" },
  { value: "Europe/Minsk", label: "Minsk", region: "Europe" },
  { value: "Europe/Riga", label: "Riga", region: "Europe" },
  { value: "Europe/Vilnius", label: "Vilnius", region: "Europe" },
  { value: "Europe/Tallinn", label: "Tallinn", region: "Europe" },
  { value: "Europe/Zagreb", label: "Zagreb", region: "Europe" },
  { value: "Europe/Ljubljana", label: "Ljubljana", region: "Europe" },
  { value: "Europe/Bratislava", label: "Bratislava", region: "Europe" },
  { value: "Europe/Skopje", label: "Skopje", region: "Europe" },
  { value: "Europe/Belgrade", label: "Belgrade", region: "Europe" },
  { value: "Europe/Sarajevo", label: "Sarajevo", region: "Europe" },
  { value: "Europe/Podgorica", label: "Podgorica", region: "Europe" },
  { value: "Europe/Tirane", label: "Tirana", region: "Europe" },
  { value: "Europe/Nicosia", label: "Nicosia", region: "Europe" },
  { value: "Europe/Luxembourg", label: "Luxembourg", region: "Europe" },
  { value: "Europe/Malta", label: "Malta", region: "Europe" },

  // Americas
  { value: "America/New_York", label: "New York", region: "Americas" },
  { value: "America/Chicago", label: "Chicago", region: "Americas" },
  { value: "America/Denver", label: "Denver", region: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles", region: "Americas" },
  { value: "America/Phoenix", label: "Phoenix", region: "Americas" },
  { value: "America/Anchorage", label: "Anchorage", region: "Americas" },
  { value: "America/Honolulu", label: "Honolulu", region: "Americas" },
  { value: "America/Toronto", label: "Toronto", region: "Americas" },
  { value: "America/Vancouver", label: "Vancouver", region: "Americas" },
  { value: "America/Montreal", label: "Montréal", region: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo", region: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", region: "Americas" },
  { value: "America/Santiago", label: "Santiago", region: "Americas" },
  { value: "America/Bogota", label: "Bogotá", region: "Americas" },
  { value: "America/Lima", label: "Lima", region: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City", region: "Americas" },
  { value: "America/Caracas", label: "Caracas", region: "Americas" },

  // Asia
  { value: "Asia/Tokyo", label: "Tokyo", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai", region: "Asia" },
  { value: "Asia/Beijing", label: "Beijing", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore", region: "Asia" },
  { value: "Asia/Seoul", label: "Seoul", region: "Asia" },
  { value: "Asia/Kolkata", label: "Kolkata", region: "Asia" },
  { value: "Asia/Mumbai", label: "Mumbai", region: "Asia" },
  { value: "Asia/Dubai", label: "Dubai", region: "Asia" },
  { value: "Asia/Riyadh", label: "Riyadh", region: "Asia" },
  { value: "Asia/Tehran", label: "Tehran", region: "Asia" },
  { value: "Asia/Baghdad", label: "Baghdad", region: "Asia" },
  { value: "Asia/Karachi", label: "Karachi", region: "Asia" },
  { value: "Asia/Dhaka", label: "Dhaka", region: "Asia" },
  { value: "Asia/Colombo", label: "Colombo", region: "Asia" },
  { value: "Asia/Yangon", label: "Yangon", region: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok", region: "Asia" },
  { value: "Asia/Jakarta", label: "Jakarta", region: "Asia" },
  { value: "Asia/Manila", label: "Manila", region: "Asia" },
  { value: "Asia/Taipei", label: "Taipei", region: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", region: "Asia" },
  { value: "Asia/Almaty", label: "Almaty", region: "Asia" },
  { value: "Asia/Tashkent", label: "Tashkent", region: "Asia" },
  { value: "Asia/Baku", label: "Baku", region: "Asia" },
  { value: "Asia/Tbilisi", label: "Tbilisi", region: "Asia" },
  { value: "Asia/Yerevan", label: "Yerevan", region: "Asia" },
  { value: "Asia/Beirut", label: "Beirut", region: "Asia" },
  { value: "Asia/Jerusalem", label: "Jerusalem", region: "Asia" },
  { value: "Asia/Amman", label: "Amman", region: "Asia" },
  { value: "Asia/Kuwait", label: "Kuwait City", region: "Asia" },
  { value: "Asia/Muscat", label: "Muscat", region: "Asia" },

  // Africa
  { value: "Africa/Cairo", label: "Cairo", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos", region: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi", region: "Africa" },
  { value: "Africa/Johannesburg", label: "Johannesburg", region: "Africa" },
  { value: "Africa/Casablanca", label: "Casablanca", region: "Africa" },
  { value: "Africa/Accra", label: "Accra", region: "Africa" },
  { value: "Africa/Addis_Ababa", label: "Addis Ababa", region: "Africa" },
  { value: "Africa/Dar_es_Salaam", label: "Dar es Salaam", region: "Africa" },
  { value: "Africa/Khartoum", label: "Khartoum", region: "Africa" },
  { value: "Africa/Algiers", label: "Algiers", region: "Africa" },
  { value: "Africa/Tunis", label: "Tunis", region: "Africa" },
  { value: "Africa/Tripoli", label: "Tripoli", region: "Africa" },
  { value: "Africa/Kampala", label: "Kampala", region: "Africa" },
  { value: "Africa/Dakar", label: "Dakar", region: "Africa" },

  // Oceania
  { value: "Australia/Sydney", label: "Sydney", region: "Oceania" },
  { value: "Australia/Melbourne", label: "Melbourne", region: "Oceania" },
  { value: "Australia/Perth", label: "Perth", region: "Oceania" },
  { value: "Australia/Brisbane", label: "Brisbane", region: "Oceania" },
  { value: "Australia/Adelaide", label: "Adelaide", region: "Oceania" },
  { value: "Pacific/Auckland", label: "Auckland", region: "Oceania" },
  { value: "Pacific/Fiji", label: "Fiji", region: "Oceania" },
];

/** All unique IANA timezone values in this list — used for validation. */
export const VALID_TIMEZONES = new Set(TIMEZONE_OPTIONS.map((o) => o.value));

/** Grouped by region — suitable for `<SelectGroup>`. */
export const TIMEZONE_OPTIONS_BY_REGION: Record<string, TimezoneOption[]> =
  TIMEZONE_OPTIONS.reduce<Record<string, TimezoneOption[]>>((acc, opt) => {
    (acc[opt.region] ??= []).push(opt);
    return acc;
  }, {});

/** Ordered region keys for rendering groups in a consistent order. */
export const TIMEZONE_REGIONS = [
  "Europe",
  "Americas",
  "Asia",
  "Africa",
  "Oceania",
] as const;
