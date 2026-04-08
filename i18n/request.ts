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
import { auth } from "@/lib/auth/auth";
import { getUserPreferences } from "@/lib/settings";

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
  const headerStore = await headers();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;

  let locale = DEFAULT_LANGUAGE;

  if (isSupportedLanguage(cookieLanguage)) {
    locale = cookieLanguage;
  } else {
    // Cookie is absent (e.g. fresh browser after wipe) — try to restore from DB
    // for authenticated users so the correct language is used immediately.
    const sessionCookie =
      cookieStore.get("better-auth.session_token")?.value ??
      cookieStore.get("__Secure-better-auth.session_token")?.value;

    let resolvedFromDb = false;

    if (sessionCookie) {
      try {
        const session = await auth.api.getSession({ headers: headerStore });
        if (session?.user?.id) {
          const prefs = await getUserPreferences(session.user.id);
          if (prefs.language) {
            locale = prefs.language;
            resolvedFromDb = true;
          }
        }
      } catch {
        // DB unavailable — fall through to Accept-Language
      }
    }

    if (!resolvedFromDb) {
      locale = getLanguageFromHeader(headerStore.get("accept-language"));
    }
  }

  const messageModule = (await import(`@/messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };

  return {
    locale,
    messages: messageModule.default,
  };
});
