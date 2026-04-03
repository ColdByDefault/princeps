/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import {
  type AppLanguage,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from "@/types/i18n";

type Props = {
  language: AppLanguage;
};

/**
 * Ensures the language cookie and localStorage are in sync with the
 * server-resolved locale on first mount (e.g. after cookie clearance).
 */
export function LanguageHydrator({ language }: Props) {
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
    const cookieValue = cookie
      ? decodeURIComponent(cookie.split("=")[1] ?? "")
      : null;

    if (!isSupportedLanguage(cookieValue)) {
      document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = language;
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language]);

  return null;
}
