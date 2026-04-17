/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

export const SUPPORTED_LANGUAGES = ["de", "en"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "de";
export const LANGUAGE_COOKIE_NAME = "akhiil-language";
export const LANGUAGE_STORAGE_KEY = "akhiil-language";

export function isSupportedLanguage(
  value: string | null | undefined,
): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}
