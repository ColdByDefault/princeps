/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { searchKnowledge } from "@/lib/knowledge/search.logic";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleSearchKnowledge(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const query = typeof args.query === "string" ? args.query.trim() : null;

  if (!query) {
    return { ok: false, error: "search_knowledge requires a non-empty query." };
  }

  const topK =
    typeof args.topK === "number" && args.topK > 0 && args.topK <= 10
      ? args.topK
      : 5;

  const results = await searchKnowledge(userId, query, topK);

  if (results.length === 0) {
    return {
      ok: true,
      data: {
        results: [],
        message:
          "No relevant knowledge documents found for this query. The user may not have uploaded any documents, or none match closely enough.",
      },
    };
  }

  return {
    ok: true,
    data: {
      results: results.map((r) => ({
        documentName: r.documentName,
        content: r.content,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    },
  };
}

export const knowledgeHandlers: Record<string, ToolHandler> = {
  search_knowledge: handleSearchKnowledge,
};
