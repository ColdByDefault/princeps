/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  isSupportedLanguage,
} from "@/types/i18n";

function getLanguageFromHeader(value: string | null) {
  if (!value) return DEFAULT_LANGUAGE;

  const candidates = value
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase().slice(0, 2) ?? "")
    .filter(Boolean);

  return candidates.find((c) => isSupportedLanguage(c)) ?? DEFAULT_LANGUAGE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;

  let locale = DEFAULT_LANGUAGE;

  if (isSupportedLanguage(cookieLanguage)) {
    locale = cookieLanguage;
  } else {
    const headerStore = await headers();
    locale = getLanguageFromHeader(headerStore.get("accept-language"));
  }

  const messageModule = (await import(`@/messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };

  return {
    locale,
    messages: messageModule.default,
  };
});
