/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import { isSupportedLanguage, type AppLanguage } from "@/types/i18n";
import { VALID_TIMEZONES } from "@/lib/weather/timezone-list";
import { VALID_LOCATIONS } from "@/lib/weather/location-list";
import type { Prisma } from "@/prisma/generated/prisma/client";

export const ASSISTANT_TONES = [
  "professional",
  "friendly",
  "casual",
  "witty",
  "motivational",
  "concise",
] as const;
export type AssistantTone = (typeof ASSISTANT_TONES)[number];

export const ADDRESS_STYLES = [
  "firstname",
  "formal_male",
  "formal_female",
  "informal",
] as const;
export type AddressStyle = (typeof ADDRESS_STYLES)[number];

export const RESPONSE_LENGTHS = ["brief", "balanced", "detailed"] as const;
export type ResponseLength = (typeof RESPONSE_LENGTHS)[number];

// ─── Types ────────────────────────────────────────────────

export interface UserPreferences {
  language: AppLanguage | null;
  theme: string | null;
  notificationsEnabled: boolean | null;
  location: string | null;
  assistantName: string | null;
  assistantTone: AssistantTone | null;
  addressStyle: AddressStyle | null;
  responseLength: ResponseLength | null;
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

  const notificationsEnabled =
    typeof obj.notificationsEnabled === "boolean"
      ? obj.notificationsEnabled
      : null;

  const location =
    typeof obj.location === "string" && VALID_LOCATIONS.has(obj.location)
      ? obj.location
      : null;

  const assistantName =
    typeof obj.assistantName === "string" && obj.assistantName.trim().length > 0
      ? obj.assistantName.trim().slice(0, 32)
      : null;

  const assistantTone = ASSISTANT_TONES.includes(
    obj.assistantTone as AssistantTone,
  )
    ? (obj.assistantTone as AssistantTone)
    : null;

  const addressStyle = ADDRESS_STYLES.includes(obj.addressStyle as AddressStyle)
    ? (obj.addressStyle as AddressStyle)
    : null;

  const responseLength = RESPONSE_LENGTHS.includes(
    obj.responseLength as ResponseLength,
  )
    ? (obj.responseLength as ResponseLength)
    : null;

  return {
    language,
    theme,
    notificationsEnabled,
    location,
    assistantName,
    assistantTone,
    addressStyle,
    responseLength,
  };
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

    if (!user)
      return {
        language: null,
        theme: null,
        notificationsEnabled: null,
        location: null,
        assistantName: null,
        assistantTone: null,
        addressStyle: null,
        responseLength: null,
      };
    return parsePreferences(user.preferences);
  },
);

// ─── Mutations ────────────────────────────────────────────

export async function updateUserPreferences(
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<void> {
  const current = await getUserPreferences(userId);

  const merged = { ...current, ...patch };
  const next: Record<string, unknown> = {};

  if (merged.language) next.language = merged.language;
  if (merged.theme) next.theme = merged.theme;
  if (
    merged.notificationsEnabled !== null &&
    merged.notificationsEnabled !== undefined
  ) {
    next.notificationsEnabled = merged.notificationsEnabled;
  }
  if (merged.location) next.location = merged.location;
  if (merged.assistantName) next.assistantName = merged.assistantName;
  if (merged.assistantTone) next.assistantTone = merged.assistantTone;
  if (merged.addressStyle) next.addressStyle = merged.addressStyle;
  if (merged.responseLength) next.responseLength = merged.responseLength;
  await db.user.update({
    where: { id: userId },
    data: {
      preferences: next as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Updates the user's location preference (city key for weather).
 * Only accepts valid keys from the known location list.
 */
export async function updateUserLocation(
  userId: string,
  location: string,
): Promise<void> {
  if (!VALID_LOCATIONS.has(location)) {
    throw new Error("Invalid location value.");
  }
  const current = await getUserPreferences(userId);
  await updateUserPreferences(userId, { ...current, location });
}

/**
 * Updates the user's timezone field directly on the User row.
 * Only accepts valid IANA keys from the known timezone list.
 */
export async function updateUserTimezone(
  userId: string,
  timezone: string,
): Promise<void> {
  if (!VALID_TIMEZONES.has(timezone)) {
    throw new Error("Invalid timezone value.");
  }

  await db.user.update({
    where: { id: userId },
    data: { timezone },
  });
}
