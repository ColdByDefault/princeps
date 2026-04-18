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
 * Client-safe weather types.
 * No server-only imports — safe to use in client components.
 */

export interface WeatherSnapshot {
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
  conditionEmoji: string;
  location: string;
}
