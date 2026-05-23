/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import "server-only";

import { listReadingItems } from "@/lib/features/reading-queue";
import type { ContextSlot } from "@/lib/ai/context";

export const readingQueueSlot: ContextSlot = {
  key: "reading-queue",
  label: "Reading Queue",
  async fetch(userId) {
    const items = await listReadingItems(userId, { status: "unread" });
    if (items.length === 0) return null;

    // Surface the top 5 by relevance score for the context window
    const top = items.slice(0, 5);

    const lines = top.map((item) => {
      const score =
        item.relevanceScore !== null
          ? ` (score: ${item.relevanceScore.toFixed(2)})`
          : "";
      const summary = item.aiSummary
        ? ` — ${item.aiSummary.slice(0, 120)}${item.aiSummary.length > 120 ? "…" : ""}`
        : "";
      return `- [${item.id}] ${item.title ?? item.url}${score}${summary}`;
    });

    return lines.join("\n");
  },
};
