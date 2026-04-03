/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import { isSupportedLanguage, type AppLanguage } from "@/types/i18n";

// ─── Types ────────────────────────────────────────────────

export interface UserPreferences {
  language: AppLanguage | null;
  theme: string | null;
}

// ─── Internal helpers ─────────────────────────────────────

function parsePreferences(raw: unknown): UserPreferences {
  let obj: Record<string, unknown> = {};

  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  } else if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  }

  const language = isSupportedLanguage(obj.language as string)
    ? (obj.language as AppLanguage)
    : null;

  const rawTheme = obj.theme;
  const theme =
    typeof rawTheme === "string" &&
    ["light", "dark", "system"].includes(rawTheme)
      ? rawTheme
      : null;

  return { language, theme };
}

// ─── Queries ──────────────────────────────────────────────

/**
 * Reads the user's saved preferences from the DB.
 * Deduplicates within a single request via React.cache().
 */
export const getUserPreferences = cache(
  async (userId: string): Promise<UserPreferences> => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) return { language: null, theme: null };
    return parsePreferences(user.preferences);
  },
);

// ─── Mutations ────────────────────────────────────────────

export async function updateUserPreferences(
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<void> {
  const current = await getUserPreferences(userId);

  const next: Record<string, string> = {};
  const merged = { ...current, ...patch };

  if (merged.language) next.language = merged.language;
  if (merged.theme) next.theme = merged.theme;

  await db.user.update({
    where: { id: userId },
    data: { preferences: next },
  });
}
