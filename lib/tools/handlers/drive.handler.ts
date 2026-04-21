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

import { searchKnowledge } from "@/lib/knowledge/search.logic";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleSearchDrive(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const query = typeof args.query === "string" ? args.query.trim() : null;

  if (!query) {
    return { ok: false, error: "search_drive requires a non-empty query." };
  }

  const topK =
    typeof args.topK === "number" && args.topK > 0 && args.topK <= 10
      ? args.topK
      : 5;

  const results = await searchKnowledge(userId, query, topK, 0.3, "drive");

  if (results.length === 0) {
    return {
      ok: true,
      data: {
        results: [],
        message:
          "No relevant Drive documents found for this query. The user may not have connected Google Drive, no files have been indexed yet, or none match closely enough.",
      },
    };
  }

  return {
    ok: true,
    data: {
      results: results.map((r) => ({
        fileName: r.documentName,
        content: r.content,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    },
  };
}

export const driveHandlers: Record<string, ToolHandler> = {
  search_drive: handleSearchDrive,
};
