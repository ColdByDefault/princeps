/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
  type AppLanguage,
} from "@/types/i18n";

const LANGUAGE_CHANGE_EVENT = "akhiil-language-change";

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
    window.dispatchEvent(
      new CustomEvent<AppLanguage>(LANGUAGE_CHANGE_EVENT, {
        detail: language,
      }),
    );
  }
}

function getSnapshot(): AppLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const cookieLanguage = getCookie(LANGUAGE_COOKIE_NAME);

  if (isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  const htmlLanguage = document.documentElement.lang.toLowerCase();

  if (isSupportedLanguage(htmlLanguage)) {
    return htmlLanguage;
  }

  return getBrowserLanguage();
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => {
    callback();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  };
}

export function useLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_LANGUAGE,
  );

  const changeLanguage = (nextLanguage: AppLanguage) => {
    persistLanguage(nextLanguage);
  };

  return {
    language,
    changeLanguage,
    isLoading: false,
    isGerman: language === "de",
    isEnglish: language === "en",
  };
}
