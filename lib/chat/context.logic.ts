/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type OllamaMessage } from "@/lib/chat/ollama";

/**
 * Assembles the system prompt from all available user-scoped data.
 * Each section is independently fetched; missing features simply contribute
 * nothing. Adding a new feature means adding a new slot here.
 */
export async function buildSystemPrompt(
  userId: string,
  chatId: string,
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

  void chatId; // reserved for per-chat context

  return { role: "system", content: lines.join("\n") };
}
