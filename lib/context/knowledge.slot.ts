/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { type ContextSlot } from "@/lib/context";
import { searchKnowledge } from "@/lib/knowledge/search.logic";

const TOP_K = 5;

export const knowledgeSlot: ContextSlot = {
  key: "knowledge",
  label: "Relevant knowledge",
  async fetch(userId: string, query: string): Promise<string | null> {
    if (!query.trim()) return null;

    const chunks = await searchKnowledge(userId, query, TOP_K);
    if (chunks.length === 0) return null;

    return chunks.map((c, i) => `[${i + 1}] ${c.content.trim()}`).join("\n\n");
  },
};
