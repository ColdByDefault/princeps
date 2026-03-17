/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
  type AppLanguage,
} from "@/types/i18n";

const emptySubscribe = () => () => {};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
}

function getBrowserLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const browserLanguage = navigator.language.toLowerCase().slice(0, 2);

  return isSupportedLanguage(browserLanguage)
    ? browserLanguage
    : DEFAULT_LANGUAGE;
}

function persistLanguage(language: AppLanguage) {
  if (typeof document !== "undefined") {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = language;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

function getSnapshot(): AppLanguage {
  if (typeof document === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const htmlLanguage = document.documentElement.lang.toLowerCase();

  if (isSupportedLanguage(htmlLanguage)) {
    return htmlLanguage;
  }

  const cookieLanguage = getCookie(LANGUAGE_COOKIE_NAME);

  if (isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return getBrowserLanguage();
}

export function useLanguage() {
  const initialLanguage = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    () => DEFAULT_LANGUAGE,
  );

  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);

  useEffect(() => {
    setLanguage(initialLanguage);
    persistLanguage(initialLanguage);
  }, [initialLanguage]);

  const changeLanguage = (nextLanguage: AppLanguage) => {
    persistLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };

  return {
    language,
    changeLanguage,
    isLoading: false,
    isGerman: language === "de",
    isEnglish: language === "en",
  };
}
