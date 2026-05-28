/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.1.4
 */

import "server-only";

import { db } from "@/lib/core/db";
import { callChat } from "@/lib/ai/llm-providers/provider";
import { listGoals } from "@/lib/features/goals/list.logic";
import { READING_ITEM_SELECT, toReadingItemRecord } from "./shared.logic";
import type { CreateReadingItemInput } from "./schemas";
import type { ReadingItemRecord } from "@/types/api";

/** Maximum HTML body characters sent to the LLM for summarisation. */
const MAX_CONTENT_CHARS = 4_000;

/**
 * Fetches the page at `url`, strips HTML tags, and returns up to
 * MAX_CONTENT_CHARS of plain text. Returns an empty string on failure.
 */
async function fetchPageText(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Princeps/1.0 (reading-queue-bot)" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      return "";
    }

    const html = await response.text();

    // Strip tags, collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, " ")
      .trim();

    return text.slice(0, MAX_CONTENT_CHARS);
  } catch {
    return "";
  }
}

/**
 * Calls the LLM to produce a short summary and a relevance score
 * (0–1) against the user's open goal descriptions. Returns compact
 * JSON: { title, summary, score }.
 */
async function summariseAndScore(
  url: string,
  pageText: string,
  goalDescriptions: string[],
): Promise<{
  title: string | null;
  summary: string | null;
  score: number;
  promptTokens: number;
  completionTokens: number;
}> {
  const goalSection =
    goalDescriptions.length > 0
      ? `User's active goals:\n${goalDescriptions.map((g) => `- ${g}`).join("\n")}`
      : "User has no active goals.";

  const content =
    pageText.trim().length > 0
      ? `Page URL: ${url}\n\nPage content excerpt:\n${pageText}`
      : `Page URL: ${url}\n\n(No page content could be retrieved.)`;

  const prompt = `You are a reading relevance assistant.

${goalSection}

${content}

Based on the page content above, respond with a JSON object and nothing else:
{
  "title": "<short page title, max 120 chars, or null if unknown>",
  "summary": "<2–3 sentence summary of the article, or null if content is unavailable>",
  "score": <relevance score 0.0–1.0 reflecting how useful this article is for the user's active goals; use 0.0 if no goals exist>
}

Only return valid JSON. Do not add markdown fences.`;

  try {
    const result = await callChat([{ role: "user", content: prompt }], {
      temperature: 0.1,
    });

    const raw = (result.content ?? "").trim();
    const parsed = JSON.parse(raw) as {
      title?: unknown;
      summary?: unknown;
      score?: unknown;
    };

    const title =
      typeof parsed.title === "string" && parsed.title.trim().length > 0
        ? parsed.title.trim().slice(0, 120)
        : null;

    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : null;

    const rawScore = typeof parsed.score === "number" ? parsed.score : 0;
    const score = Math.max(0, Math.min(1, rawScore));

    return {
      title,
      summary,
      score,
      promptTokens: result.promptTokens ?? 0,
      completionTokens: result.completionTokens ?? 0,
    };
  } catch {
    return {
      title: null,
      summary: null,
      score: 0,
      promptTokens: 0,
      completionTokens: 0,
    };
  }
}

export async function createReadingItem(
  userId: string,
  input: CreateReadingItemInput,
): Promise<ReadingItemRecord> {
  // Fetch + summarise concurrently with goal retrieval
  const [pageText, goals] = await Promise.all([
    fetchPageText(input.url),
    listGoals(userId, { status: "open" }),
  ]);

  const goalDescriptions = goals
    .map((g) => (g.description ? `${g.title}: ${g.description}` : g.title))
    .filter(Boolean);

  const { title, summary, score, promptTokens, completionTokens } =
    await summariseAndScore(input.url, pageText, goalDescriptions);

  const row = await db.readingItem.create({
    data: {
      userId,
      url: input.url,
      title: input.title ?? title,
      aiSummary: summary,
      relevanceScore: score,
    },
    select: READING_ITEM_SELECT,
  });

  // Accumulate summarisation tokens into the monthly budget so manual UI
  // saves and tool-call saves both count against the user's usage.
  // Fire-and-forget — token tracking must never block the user response.
  const totalTokens = promptTokens + completionTokens;
  if (totalTokens > 0) {
    db.usageCounter
      .upsert({
        where: { userId },
        create: { userId, tokenMonthlyCount: totalTokens },
        update: { tokenMonthlyCount: { increment: totalTokens } },
      })
      .catch(() => {});
  }

  return toReadingItemRecord(row);
}
