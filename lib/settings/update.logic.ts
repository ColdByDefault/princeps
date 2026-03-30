/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  type UserPreferences,
  DEFAULT_PREFERENCES,
  isResponseStyle,
  DEFAULT_SCHEDULED_NOTIF_PREFS,
} from "@/types/settings";
import { isSupportedLanguage } from "@/types/i18n";

export async function updateUserPreferences(
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const existing =
    user.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  const merged: Record<string, unknown> = {
    ...existing,
  };

  if (patch.language !== undefined && isSupportedLanguage(patch.language)) {
    merged["language"] = patch.language;
  }

  if (patch.assistantName !== undefined) {
    merged["assistantName"] =
      patch.assistantName.trim().slice(0, 30) ||
      DEFAULT_PREFERENCES.assistantName;
  }

  if (patch.systemPrompt !== undefined) {
    merged["systemPrompt"] = patch.systemPrompt.trim().slice(0, 2000);
  }

  if (
    patch.responseStyle !== undefined &&
    isResponseStyle(patch.responseStyle)
  ) {
    merged["responseStyle"] = patch.responseStyle;
  }

  if (patch.ollamaOptions !== undefined) {
    const opts = patch.ollamaOptions;
    const defaults = DEFAULT_PREFERENCES.ollamaOptions;

    merged["ollamaOptions"] = {
      temperature: clamp(opts.temperature ?? defaults.temperature, 0, 2),
      top_p: clamp(opts.top_p ?? defaults.top_p, 0, 1),
      top_k: Math.round(clamp(opts.top_k ?? defaults.top_k, 0, 200)),
      num_ctx: Math.round(clamp(opts.num_ctx ?? defaults.num_ctx, 512, 131072)),
      repeat_penalty: clamp(
        opts.repeat_penalty ?? defaults.repeat_penalty,
        0.5,
        2,
      ),
    };
  }

  if (patch.scheduledNotifications !== undefined) {
    const sn = patch.scheduledNotifications;
    const d = DEFAULT_SCHEDULED_NOTIF_PREFS;
    const validBriefing = ["off", "daily", "weekly"];
    const validOnOff = ["off", "on"];
    const validDaily = ["off", "daily"];

    merged["scheduledNotifications"] = {
      briefing: validBriefing.includes(sn.briefing) ? sn.briefing : d.briefing,
      tasksOverdue: validDaily.includes(sn.tasksOverdue)
        ? sn.tasksOverdue
        : d.tasksOverdue,
      meetingFollowup: validOnOff.includes(sn.meetingFollowup)
        ? sn.meetingFollowup
        : d.meetingFollowup,
      weeklyDigest: validOnOff.includes(sn.weeklyDigest)
        ? sn.weeklyDigest
        : d.weeklyDigest,
    };
  }

  await db.user.update({
    where: { id: userId },
    data: { preferences: merged as Prisma.InputJsonObject },
  });

  return { ok: true };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
