/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/chat/ollama";
import { SLOT_REGISTRY } from "@/lib/context";
import { db } from "@/lib/db";

export type BriefingResult = {
  content: string;
  generatedAt: Date;
};

/**
 * Assembles context from all registered slots, calls Ollama non-streaming to
 * generate a plain-prose daily brief, and upserts the result into BriefingCache.
 */
export async function generateBriefing(
  userId: string,
  userName: string | null,
  timezone: string,
  language: string = "en",
): Promise<BriefingResult> {
  const tz = timezone || "UTC";
  const dateLocale = language === "de" ? "de-DE" : "en-US";
  const langName = language === "de" ? "German" : "English";
  const now = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
  });

  const slotResults = await Promise.all(
    SLOT_REGISTRY.map((slot) => slot.fetch(userId, "daily brief")),
  );

  const contextLines: string[] = [];
  for (let i = 0; i < SLOT_REGISTRY.length; i++) {
    const result = slotResults[i];
    if (result) {
      contextLines.push(`## ${SLOT_REGISTRY[i].label}\n${result}`);
    }
  }

  const context = contextLines.join("\n\n");

  const prompt = `You are writing a concise daily briefing for ${userName ?? "the user"}.
Today is ${now} (${tz}).

Here is the user's current workspace context:
${context || "(no context available)"}

Write a focused daily brief in 3–5 sentences. Highlight the most important thing they should do or be aware of today — a meeting to prepare for, overdue tasks, or an open decision that needs action. Be direct and actionable. Do not list everything; focus on what matters most. Do not use headers, bullet points, or markdown formatting. Write in plain prose. Write entirely in ${langName}. Respond with plain text only.`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      think: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama returned ${response.status} for briefing generation`,
    );
  }

  const json = (await response.json()) as {
    message?: { content?: string };
  };
  const content = (json?.message?.content ?? "").trim();

  const record = await db.briefingCache.upsert({
    where: { userId },
    create: { userId, content, generatedAt: new Date() },
    update: { content, generatedAt: new Date() },
  });

  return { content: record.content, generatedAt: record.generatedAt };
}
