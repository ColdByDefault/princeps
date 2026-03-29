/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import {
  type UserPreferences,
  DEFAULT_PREFERENCES,
  isResponseStyle,
} from "@/types/settings";
import {
  isSupportedLanguage,
  type AppLanguage,
  DEFAULT_LANGUAGE,
} from "@/types/i18n";

function parseLanguage(raw: Record<string, unknown>): AppLanguage {
  const v = raw["language"];
  if (typeof v === "string" && isSupportedLanguage(v)) return v;
  return DEFAULT_LANGUAGE;
}

function numOpt(
  opts: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  return typeof opts[key] === "number" ? (opts[key] as number) : fallback;
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const raw =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  const rawOpts =
    raw["ollamaOptions"] && typeof raw["ollamaOptions"] === "object"
      ? (raw["ollamaOptions"] as Record<string, unknown>)
      : {};

  const d = DEFAULT_PREFERENCES.ollamaOptions;

  return {
    language: parseLanguage(raw),
    assistantName:
      typeof raw["assistantName"] === "string" && raw["assistantName"].trim()
        ? raw["assistantName"].trim().slice(0, 30)
        : DEFAULT_PREFERENCES.assistantName,
    systemPrompt:
      typeof raw["systemPrompt"] === "string"
        ? raw["systemPrompt"]
        : typeof raw["assistantInstructions"] === "string"
          ? raw["assistantInstructions"]
          : DEFAULT_PREFERENCES.systemPrompt,
    responseStyle: isResponseStyle(raw["responseStyle"])
      ? raw["responseStyle"]
      : DEFAULT_PREFERENCES.responseStyle,
    ollamaOptions: {
      temperature: numOpt(rawOpts, "temperature", d.temperature),
      top_p: numOpt(rawOpts, "top_p", d.top_p),
      top_k: numOpt(rawOpts, "top_k", d.top_k),
      num_ctx: numOpt(rawOpts, "num_ctx", d.num_ctx),
      repeat_penalty: numOpt(rawOpts, "repeat_penalty", d.repeat_penalty),
    },
  };
}
