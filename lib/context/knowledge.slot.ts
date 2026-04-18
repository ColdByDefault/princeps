/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { searchKnowledge } from "@/lib/knowledge";
import type { ContextSlot } from "@/lib/context";

/**
 * RAG context slot. On each chat turn the user's query is embedded and the
 * most semantically similar knowledge chunks are injected into the system
 * prompt. The LLM can read these and cite them naturally.
 *
 * The LLM has NO write or delete tools for knowledge documents — this slot
 * is read-only by design.
 */
export const knowledgeSlot: ContextSlot = {
  key: "knowledge",
  label: "Relevant Knowledge",
  async fetch(userId, query) {
    // No query → skip RAG (e.g., empty turn or tool-only messages)
    if (!query || query.trim().length < 5) return null;

    let results;
    try {
      results = await searchKnowledge(userId, query, 5, 0.3);
    } catch {
      // Embedding provider unavailable — degrade gracefully, don't fail the chat
      return null;
    }

    if (results.length === 0) return null;

    const lines = results.map(
      (r, i) =>
        `[${i + 1}] (from "${r.documentName}", similarity ${r.similarity.toFixed(2)})\n${r.content}`,
    );

    return lines.join("\n\n---\n\n");
  },
};
