/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPreferences } from "@/lib/settings/get.logic";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  isSupportedLanguage,
  type AppLanguage,
  type MessageDictionary,
} from "@/types/i18n";

const messagesByLanguage: Record<AppLanguage, MessageDictionary> = {
  de: deMessages as MessageDictionary,
  en: enMessages as MessageDictionary,
};

function getLanguageFromHeader(value: string | null): AppLanguage {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const candidates = value
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase().slice(0, 2) ?? "")
    .filter(Boolean);

  const supportedLanguage = candidates.find((candidate) =>
    isSupportedLanguage(candidate),
  );

  return supportedLanguage ?? DEFAULT_LANGUAGE;
}

export async function getRequestLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;

  if (isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  const headerStore = await headers();

  // No cookie: check DB preference for authenticated users (cross-device persistence)
  try {
    const session = await auth.api.getSession({ headers: headerStore });
    if (session?.user?.id) {
      const prefs = await getUserPreferences(session.user.id);
      if (isSupportedLanguage(prefs.language)) {
        return prefs.language;
      }
    }
  } catch {
    // ignore auth/db errors, fall through to accept-language
  }

  return getLanguageFromHeader(headerStore.get("accept-language"));
}

export async function getRequestMessages(
  language: AppLanguage,
): Promise<MessageDictionary> {
  return messagesByLanguage[language];
}

export async function getRequestConfig() {
  const language = await getRequestLanguage();

  return {
    language,
    messages: await getRequestMessages(language),
  };
}
