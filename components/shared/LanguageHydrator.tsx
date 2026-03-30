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
 * Sets the language cookie and localStorage from the server-resolved language
 * on first mount, if no client cookie is present yet — e.g. after a fresh
 * login or cookie clearance. Fires the custom event so useLanguage updates.
 */
export function LanguageHydrator({ language }: Props) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
    const cookieValue = cookie
      ? decodeURIComponent(cookie.split("=")[1] ?? "")
      : null;

    // Only hydrate if no valid cookie exists yet
    if (!isSupportedLanguage(cookieValue)) {
      document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = language;
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      window.dispatchEvent(
        new CustomEvent<AppLanguage>("akhiil-language-change", {
          detail: language,
        }),
      );
    }
  }, [language]);

  return null;
}
