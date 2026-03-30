/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { generateAndPushNotification } from "./generate.logic";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { db } from "@/lib/db";

/**
 * Fires a welcome_signup notification after a new user record is created.
 * Intended for use in the Better Auth `user.create.after` database hook.
 */
export async function onUserCreated(user: {
  id: string;
  name?: string | null;
}): Promise<void> {
  const prefs = await getUserPreferences(user.id);

  void generateAndPushNotification({
    userId: user.id,
    userName: user.name ?? null,
    locale: prefs.language,
    category: "welcome_signup",
  });
}

/**
 * Fires a welcome_login notification after a new session is created.
 * Skips if:
 * - the session was created within 60 seconds of the user record (new signup)
 * - a welcome_login notification was already generated for this user today (UTC)
 * Intended for use in the Better Auth `session.create.after` database hook.
 */
export async function onSessionCreated(session: {
  userId: string;
}): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, createdAt: true },
  });

  if (!user) return;

  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  if (ageMs < 60_000) return;

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const alreadyGreetedToday = await db.notification.findFirst({
    where: {
      userId: session.userId,
      category: { in: ["welcome_signup", "welcome_login"] },
      createdAt: { gte: startOfToday },
    },
    select: { id: true },
  });

  if (alreadyGreetedToday) return;

  const prefs = await getUserPreferences(session.userId);

  void generateAndPushNotification({
    userId: session.userId,
    userName: user.name ?? null,
    locale: prefs.language,
    category: "welcome_login",
  });
}
