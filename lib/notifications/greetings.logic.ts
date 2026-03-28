/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { generateAndPushNotification } from "./generate.logic";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/types/i18n";

function extractLocale(preferences: unknown): string {
  if (
    preferences &&
    typeof preferences === "object" &&
    "language" in preferences &&
    isSupportedLanguage(
      typeof (preferences as Record<string, unknown>)["language"] === "string"
        ? ((preferences as Record<string, unknown>)["language"] as string)
        : undefined,
    )
  ) {
    return (preferences as Record<string, unknown>)["language"] as string;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Fires a welcome_signup notification after a new user record is created.
 * Intended for use in the Better Auth `user.create.after` database hook.
 */
export async function onUserCreated(user: {
  id: string;
  name?: string | null;
}): Promise<void> {
  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { preferences: true },
  });
  const locale = extractLocale(record?.preferences);

  void generateAndPushNotification({
    userId: user.id,
    userName: user.name ?? null,
    locale,
    category: "welcome_signup",
  });
}

/**
 * Fires a welcome_login notification after a new session is created.
 * Skips if the session was created within 60 seconds of the user record
 * to avoid double-firing alongside welcome_signup.
 * Intended for use in the Better Auth `session.create.after` database hook.
 */
export async function onSessionCreated(session: {
  userId: string;
}): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, createdAt: true, preferences: true },
  });

  if (!user) return;

  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  if (ageMs < 60_000) return;

  const locale = extractLocale(user.preferences);

  void generateAndPushNotification({
    userId: session.userId,
    userName: user.name ?? null,
    locale,
    category: "welcome_login",
  });
}
