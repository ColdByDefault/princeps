/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since beta
 */

export const SUPPORTED_LANGUAGES = ["de", "en"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "de";
export const LANGUAGE_COOKIE_NAME = "princeps-language";
export const LANGUAGE_STORAGE_KEY = "princeps-language";

export function isSupportedLanguage(
  value: string | null | undefined,
): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}
