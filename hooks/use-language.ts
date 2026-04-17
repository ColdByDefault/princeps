/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  type AppLanguage,
} from "@/types/i18n";

const LANGUAGE_CHANGE_EVENT = "akhiil-language-change";

function persistLanguage(language: AppLanguage) {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = language;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(
    new CustomEvent<AppLanguage>(LANGUAGE_CHANGE_EVENT, {
      detail: language,
    }),
  );
}

export function useLanguage() {
  const locale = useLocale() as AppLanguage;
  const router = useRouter();

  const changeLanguage = (next: AppLanguage) => {
    persistLanguage(next);
    router.refresh();
  };

  return {
    language: locale,
    changeLanguage,
    isGerman: locale === "de",
    isEnglish: locale === "en",
  };
}
