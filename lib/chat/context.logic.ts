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
): Promise<OllamaMessage> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, timezone: true, preferences: true },
  });

  const prefs =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  const tz = user?.timezone ?? "UTC";
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
  });

  const customInstructions =
    typeof prefs["assistantInstructions"] === "string" &&
    prefs["assistantInstructions"].trim()
      ? prefs["assistantInstructions"].trim()
      : null;

  const lines: string[] = [
    `You are the private executive assistant for ${user?.name ?? "the user"}.`,
    `Today is ${now} (${tz}).`,
    "",
    "Behavior:",
    "- Be direct, concise, and actionable.",
    "- Make reasonable inferences — do not ask clarifying questions unless absolutely necessary.",
    "- Do not offer to draft emails, messages, or communications unless the user explicitly asks.",
    "- Focus on decisions, planning, preparation, and follow-through.",
  ];

  if (customInstructions) {
    lines.push("", `Custom instructions from user: ${customInstructions}`);
  }

  void chatId; // reserved for per-chat context

  return { role: "system", content: lines.join("\n") };
}
