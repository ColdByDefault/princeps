/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

/**
 * Client-safe EU timezone option list.
 * Contains only IANA keys and display labels — no coordinates.
 * Safe to import in client components and shared bundles.
 *
 * Covers the distinct UTC offsets present across EU/UK countries:
 *   UTC+0/+1  → London, Lisbon
 *   UTC+1/+2  → most of continental Western & Central Europe
 *   UTC+2/+3  → Poland, Greece, Finland, Baltics
 */
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // UTC+0 / UTC+1 (WET/WEST)
  {
    value: "Europe/London",
    label: "London / Dublin (UTC+0/+1)",
    offset: "UTC+0/+1",
  },
  {
    value: "Europe/Lisbon",
    label: "Lisbon / Madeira (UTC+0/+1)",
    offset: "UTC+0/+1",
  },

  // UTC+1 / UTC+2 (CET/CEST) — covers DE, FR, SE, ES, AT, CH, NL, BE, IT
  {
    value: "Europe/Berlin",
    label: "Central Europe — Berlin, Paris, Rome … (UTC+1/+2)",
    offset: "UTC+1/+2",
  },

  // UTC+2 / UTC+3 (EET/EEST) — covers PL, GR, FI, EE, LV, LT
  {
    value: "Europe/Warsaw",
    label: "Eastern Europe — Warsaw, Helsinki … (UTC+2/+3)",
    offset: "UTC+2/+3",
  },
  {
    value: "Europe/Athens",
    label: "South-East Europe — Athens, Bucharest … (UTC+2/+3)",
    offset: "UTC+2/+3",
  },

  // UTC+3 (MSK — non-EU but commonly used)
  {
    value: "Europe/Moscow",
    label: "Moscow (UTC+3)",
    offset: "UTC+3",
  },
];

/** All unique IANA timezone values in this list — used for validation. */
export const VALID_TIMEZONES = new Set(TIMEZONE_OPTIONS.map((o) => o.value));
