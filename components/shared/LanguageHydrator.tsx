/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type AppLanguage,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from "@/types/i18n";

type Props = {
  /** Server-resolved locale (used as fallback when no cookie exists). */
  language: AppLanguage;
  /**
   * The user's saved DB preference. When provided (authenticated user) this
   * always wins over whatever cookie the middleware may have seeded, so the
   * correct language is enforced on the first load after a full browser wipe.
   */
  preferredLanguage?: AppLanguage | null;
};

function setCookieAndStorage(language: AppLanguage) {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = language;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

function readCookie(): string | null {
  const entry = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : null;
}

/**
 * Ensures the language cookie and localStorage are in sync with the user's
 * saved preference on every mount, so the correct language is restored after
 * a full browser wipe (even if middleware seeded a different cookie before login).
 */
export function LanguageHydrator({ language, preferredLanguage }: Props) {
  const router = useRouter();

  useEffect(() => {
    const cookieValue = readCookie();

    // Authenticated path: DB preference is the source of truth.
    // If it differs from the current cookie (e.g. middleware seeded the wrong
    // language before login), override it and re-render with the right locale.
    if (preferredLanguage && cookieValue !== preferredLanguage) {
      setCookieAndStorage(preferredLanguage);
      router.refresh();
      return;
    }

    // Unauthenticated / no DB preference: seed from server-resolved locale
    // if the cookie is absent.
    if (!isSupportedLanguage(cookieValue)) {
      setCookieAndStorage(language);
    }
    // Also re-runs when `preferredLanguage` changes (e.g. auth transition:
    // null → real value after username login, where the layout stays mounted).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredLanguage]);

  return null;
}
