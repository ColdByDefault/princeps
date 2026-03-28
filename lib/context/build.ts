/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type OllamaMessage } from "@/lib/chat/ollama";
import { SLOT_REGISTRY } from "@/lib/context";

/**
 * Assembles the full LLM system prompt from:
 *  1. A fixed preamble (identity, date, behavior rules, custom instructions)
 *  2. All registered context slots (personal info, knowledge RAG, future features)
 *
 * Chat is only a consumer of this function — it has no knowledge of what
 * slots exist. To add a new data source, register a slot in lib/context/index.ts.
 */
export async function buildSystemPrompt(
  userId: string,
  query: string,
  customInstructions: string | null,
): Promise<OllamaMessage> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, timezone: true },
  });

  const tz = user?.timezone ?? "UTC";
  const now = new Date().toLocaleDateString("en-US", {
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
    "Behavior:",
    "- Be warm and natural in tone — greet back when greeted, match the user's conversational register.",
    "- Be direct, concise, and actionable.",
    "- Make reasonable inferences — do not ask clarifying questions unless absolutely necessary.",
    "- Do not offer to draft emails, messages, or communications unless the user explicitly asks.",
    "- Focus on decisions, planning, preparation, and follow-through.",
    "- Always respond in the same language the user writes in. If the user writes in German, respond fully in German. If the user writes in English, respond fully in English.",
  ];

  if (customInstructions) {
    lines.push("", `Custom instructions from user: ${customInstructions}`);
  }

  // Run all slots in parallel; omit sections that return null.
  const slotResults = await Promise.all(
    SLOT_REGISTRY.map((slot) => slot.fetch(userId, query)),
  );

  for (let i = 0; i < SLOT_REGISTRY.length; i++) {
    const result = slotResults[i];
    if (result) {
      lines.push("", `## ${SLOT_REGISTRY[i].label}`, result);
    }
  }

  return { role: "system", content: lines.join("\n") };
}
