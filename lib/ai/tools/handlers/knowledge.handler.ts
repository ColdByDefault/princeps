/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since beta
 */

import "server-only";

import { searchKnowledge } from "@/lib/features/knowledge/search.logic";
import { createKnowledgeDocument } from "@/lib/features/knowledge/create.logic";
import { enforceKnowledgeUpload } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

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

async function handleCreateKnowledge(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const name =
    typeof args.name === "string" ? args.name.trim().slice(0, 255) : null;
  const content = typeof args.content === "string" ? args.content.trim() : null;

  if (!name || !content) {
    return {
      ok: false,
      error: "create_knowledge requires a non-empty name and content.",
    };
  }

  // Enforce doc count + file size + lifetime char quota
  const fileSizeBytes = Buffer.byteLength(content, "utf8");
  const gate = await enforceKnowledgeUpload(
    userId,
    fileSizeBytes,
    content.length,
  );
  if (!gate.allowed) {
    return { ok: false, error: gate.reason ?? "Knowledge quota exceeded." };
  }

  const doc = await createKnowledgeDocument(userId, { name, content });

  return {
    ok: true,
    data: { id: doc.id, name: doc.name },
  };
}

export const knowledgeHandlers: Record<string, ToolHandler> = {
  search_knowledge: handleSearchKnowledge,
  create_knowledge: handleCreateKnowledge,
};
