/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/chat/ollama";
import { createNotification } from "./create.logic";
import { emitNotification } from "./emitter";

type GenerateOptions = {
  userId: string;
  userName: string | null;
  locale: string;
  category: "welcome_signup" | "welcome_login" | (string & {});
};

const CATEGORY_PROMPTS: Record<string, string> = {
  welcome_signup: `
You are writing a short, warm welcome notification for a new user who just created their account on See-Sweet — a private executive secretariat product.
Write a title (max 8 words) and a body (2–3 sentences). Be personal, warm, and concise. Do not use generic phrases like "Welcome aboard!" or "We're excited to have you". Make it feel like a thoughtful note from a trusted advisor, not a marketing email.
Never mention pricing, upsell, or features. Focus on the user beginning a new way of working.`,

  welcome_login: `
You are writing a short, contextual welcome-back notification for a user returning to See-Sweet — a private executive secretariat product.
Write a title (max 8 words) and a body (1–2 sentences). Be brief and grounding — acknowledge the return without being effusive. Do not say things like "Great to see you back!" or "We missed you". Sound like a focused assistant ready to get to work.`,
};

/**
 * Generates a notification via Ollama (non-streaming, short output), persists
 * it, and pushes it to any live SSE connections for the user.
 *
 * Fire-and-forget safe: all errors are caught and logged.
 */
export async function generateAndPushNotification(
  opts: GenerateOptions,
): Promise<void> {
  const { userId, userName, locale, category } = opts;

  const categoryPrompt =
    CATEGORY_PROMPTS[category] ??
    `Write a short notification title (max 8 words) and body (1–2 sentences) for the category: ${category}. Be concise and professional.`;

  const systemPrompt = `${categoryPrompt.trim()}

User name: ${userName ?? "the user"}
User locale: ${locale}

Respond with valid JSON only — no markdown, no explanation, no code fence:
{"title": "...", "body": "..."}`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: systemPrompt }],
        stream: false,
        think: false,
      }),
    });

    if (!response.ok) {
      console.error(
        `[notifications] Ollama returned ${response.status} for category=${category}`,
      );
      return;
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const raw = data.message?.content?.trim() ?? "";

    let parsed: { title?: string; body?: string };
    try {
      // Strip accidental markdown fences if the model adds them
      const cleaned = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/```$/, "")
        .trim();
      parsed = JSON.parse(cleaned) as { title?: string; body?: string };
    } catch {
      console.error("[notifications] Failed to parse LLM JSON:", raw);
      return;
    }

    const title = (parsed.title ?? "").trim();
    const body = (parsed.body ?? "").trim();

    if (!title || !body) {
      console.error(
        "[notifications] LLM returned empty title or body:",
        parsed,
      );
      return;
    }

    const notification = await createNotification({
      userId,
      category,
      source: "assistant",
      title,
      body,
    });

    emitNotification(userId, notification);
  } catch (err) {
    console.error("[notifications] generateAndPushNotification error:", err);
  }
}
