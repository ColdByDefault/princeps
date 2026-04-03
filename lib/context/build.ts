/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { SLOT_REGISTRY } from "@/lib/context";
import type { LLMMessage } from "@/types/llm";

type BuildOptions = {
  language: string | null;
};

/**
 * Assembles the LLM system prompt from:
 *  1. A fixed preamble (identity, date, language, behavior rules)
 *  2. All registered context slots (none yet — added as features are built)
 *
 * Chat is only a consumer of this function. To add a new data source,
 * create a slot in lib/context/ and register it in lib/context/index.ts.
 */
export async function buildSystemPrompt(
  userId: string,
  query: string,
  opts: BuildOptions,
): Promise<LLMMessage> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, timezone: true },
  });

  const tz = user?.timezone ?? "UTC";
  const lang = opts.language ?? "en";
  const dateLocale = lang === "de" ? "de-DE" : "en-US";
  const langName = lang === "de" ? "German" : "English";
  const now = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
  });

  const lines: string[] = [
    `You are the private executive assistant for ${user?.name ?? "the user"}.`,
    `Today is ${now} (${tz}).`,
    "",
    `The user's preferred language is ${langName}. Default to ${langName} in all responses. If the user writes in a different language, match that language instead.`,
    "",
    "Behavior:",
    "- Be direct, concise, and actionable.",
    "- Make reasonable inferences — do not ask clarifying questions unless absolutely necessary.",
  ];

  // Run all registered slots in parallel; omit sections that return null.
  if (SLOT_REGISTRY.length > 0) {
    const slotResults = await Promise.all(
      SLOT_REGISTRY.map((slot) => slot.fetch(userId, query)),
    );

    for (let i = 0; i < SLOT_REGISTRY.length; i++) {
      const result = slotResults[i];
      if (result) {
        lines.push("", `## ${SLOT_REGISTRY[i].label}`, result);
      }
    }
  }

  return { role: "system", content: lines.join("\n") };
}
