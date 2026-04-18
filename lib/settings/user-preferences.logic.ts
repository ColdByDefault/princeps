/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import { isSupportedLanguage, type AppLanguage } from "@/types/i18n";
import { VALID_TIMEZONES } from "@/lib/weather/timezone-list";
import type { Prisma } from "@/prisma/generated/prisma/client";
import {
  ASSISTANT_TONES,
  type AssistantTone,
  ADDRESS_STYLES,
  type AddressStyle,
  RESPONSE_LENGTHS,
  type ResponseLength,
} from "./types";

export {
  ASSISTANT_TONES,
  type AssistantTone,
  ADDRESS_STYLES,
  type AddressStyle,
  RESPONSE_LENGTHS,
  type ResponseLength,
};

// ─── Types ────────────────────────────────────────────────

export interface UserPreferences {
  language: AppLanguage | null;
  theme: string | null;
  notificationsEnabled: boolean | null;
  /** Display label for the user's chosen city (e.g. "Berlin, Germany"). */
  location: string | null;
  /** Latitude for the user's chosen city. Stored alongside `location`. */
  locationLat: number | null;
  /** Longitude for the user's chosen city. Stored alongside `location`. */
  locationLon: number | null;
  assistantName: string | null;
  assistantTone: AssistantTone | null;
  addressStyle: AddressStyle | null;
  responseLength: ResponseLength | null;
  /** Tool names the user has explicitly disabled. Absent = all enabled. */
  disabledTools: string[];
  /** Optional free-text addendum appended to the system prompt. */
  customSystemPrompt: string | null;
  /** Whether the cron job should auto-generate a daily briefing for this user. */
  autoBriefingEnabled: boolean | null;
  /** Whether the assistant should generate reports after tool interactions. */
  reportsEnabled: boolean | null;
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
    typeof obj.location === "string" && obj.location.trim().length > 0
      ? obj.location.trim().slice(0, 128)
      : null;

  const locationLat =
    typeof obj.locationLat === "number" &&
    isFinite(obj.locationLat) &&
    obj.locationLat >= -90 &&
    obj.locationLat <= 90
      ? obj.locationLat
      : null;

  const locationLon =
    typeof obj.locationLon === "number" &&
    isFinite(obj.locationLon) &&
    obj.locationLon >= -180 &&
    obj.locationLon <= 180
      ? obj.locationLon
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

  const disabledTools = Array.isArray(obj.disabledTools)
    ? (obj.disabledTools as unknown[]).filter(
        (t): t is string => typeof t === "string",
      )
    : [];

  const customSystemPrompt =
    typeof obj.customSystemPrompt === "string" &&
    obj.customSystemPrompt.trim().length > 0
      ? obj.customSystemPrompt.trim().slice(0, 2000)
      : null;

  const autoBriefingEnabled =
    typeof obj.autoBriefingEnabled === "boolean"
      ? obj.autoBriefingEnabled
      : null;

  const reportsEnabled =
    typeof obj.reportsEnabled === "boolean" ? obj.reportsEnabled : null;

  return {
    language,
    theme,
    notificationsEnabled,
    location,
    locationLat,
    locationLon,
    assistantName,
    assistantTone,
    addressStyle,
    responseLength,
    disabledTools,
    customSystemPrompt,
    autoBriefingEnabled,
    reportsEnabled,
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
        locationLat: null,
        locationLon: null,
        assistantName: null,
        assistantTone: null,
        addressStyle: null,
        responseLength: null,
        disabledTools: [],
        customSystemPrompt: null,
        autoBriefingEnabled: null,
        reportsEnabled: null,
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
  if (merged.locationLat !== null && merged.locationLat !== undefined)
    next.locationLat = merged.locationLat;
  if (merged.locationLon !== null && merged.locationLon !== undefined)
    next.locationLon = merged.locationLon;
  if (merged.assistantName) next.assistantName = merged.assistantName;
  if (merged.assistantTone) next.assistantTone = merged.assistantTone;
  if (merged.addressStyle) next.addressStyle = merged.addressStyle;
  if (merged.responseLength) next.responseLength = merged.responseLength;
  if (merged.disabledTools !== undefined)
    next.disabledTools = merged.disabledTools;
  if (merged.customSystemPrompt !== undefined)
    next.customSystemPrompt = merged.customSystemPrompt;
  if (
    merged.autoBriefingEnabled !== null &&
    merged.autoBriefingEnabled !== undefined
  )
    next.autoBriefingEnabled = merged.autoBriefingEnabled;
  if (merged.reportsEnabled !== null && merged.reportsEnabled !== undefined)
    next.reportsEnabled = merged.reportsEnabled;
  await db.user.update({
    where: { id: userId },
    data: {
      preferences: next as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Updates the user's location preference (city label + coordinates for weather).
 */
export async function updateUserLocation(
  userId: string,
  location: string,
  locationLat: number,
  locationLon: number,
): Promise<void> {
  if (
    !isFinite(locationLat) ||
    locationLat < -90 ||
    locationLat > 90 ||
    !isFinite(locationLon) ||
    locationLon < -180 ||
    locationLon > 180
  ) {
    throw new Error("Invalid location coordinates.");
  }
  const current = await getUserPreferences(userId);
  await updateUserPreferences(userId, {
    ...current,
    location: location.trim().slice(0, 128),
    locationLat,
    locationLon,
  });
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
