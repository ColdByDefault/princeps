/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
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
