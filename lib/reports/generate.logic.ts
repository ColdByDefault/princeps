/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/chat/ollama";
import { createReport } from "./create.logic";
import { createNotification } from "@/lib/notifications/create.logic";
import { emitNotification } from "@/lib/notifications/emitter";
import type { ActionResult } from "@/lib/chat/tools";

/**
 * Generates a brief plain-text summary of a completed tool-call batch via Ollama,
 * persists the AssistantReport, then creates + pushes a real-time notification.
 *
 * Fire-and-forget safe — all errors are caught and logged.
 */
export async function generateAndPushReport(opts: {
  userId: string;
  userName: string | null;
  locale: string;
  actions: ActionResult[];
}): Promise<void> {
  const { userId, userName, locale, actions } = opts;

  const toolsCalled = actions.map((a) => a.name);
  const actionLines = actions
    .map((a) => `- ${a.name}: ${JSON.stringify(a.record)}`)
    .join("\n");

  const systemPrompt = `You are writing a brief, professional summary of actions that an AI assistant just completed on behalf of a user.
The user's name is ${userName ?? "the user"} and their locale is ${locale}.

The assistant performed the following actions:
${actionLines}

Write a summary (2–4 sentences) in ${locale === "de" ? "German" : "English"} that describes what was done in plain language. Be factual and concise — do not use marketing language.
Then write a short notification title (max 8 words) for the same action batch.

Respond with valid JSON only — no markdown, no explanation, no code fence:
{"summary": "...", "title": "..."}`;

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
        `[reports] Ollama returned ${response.status} for report generation`,
      );
      return;
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const raw = data.message?.content?.trim() ?? "";

    let parsed: { summary?: string; title?: string };
    try {
      const cleaned = raw
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/```$/, "")
        .trim();
      parsed = JSON.parse(cleaned) as { summary?: string; title?: string };
    } catch {
      console.error("[reports] Failed to parse LLM JSON:", raw);
      return;
    }

    const summary = (parsed.summary ?? "").trim();
    const notifTitle = (parsed.title ?? "").trim();

    if (!summary) {
      console.error("[reports] LLM returned empty summary:", parsed);
      return;
    }

    // Persist the report
    await createReport({ userId, toolsCalled, summary });

    // Persist + push a notification
    const fallbackTitle = toolsCalled
      .map((t) => t.replace("create_", "").replace("_", " "))
      .join(", ");

    const notification = await createNotification({
      userId,
      category: "assistant_report",
      source: "assistant",
      title: notifTitle || fallbackTitle,
      body: summary,
    });

    emitNotification(userId, notification);
  } catch (err) {
    console.error("[reports] generateAndPushReport error:", err);
  }
}
