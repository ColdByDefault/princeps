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

import { db } from "@/lib/db";
import {
  KNOWLEDGE_DOCUMENT_SELECT,
  toKnowledgeDocumentRecord,
} from "./shared.logic";
import type { KnowledgeDocumentRecord } from "@/types/api";

// ─── List ─────────────────────────────────────────────────

export async function listKnowledgeDocuments(
  userId: string,
): Promise<KnowledgeDocumentRecord[]> {
  const rows = await db.knowledgeDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: KNOWLEDGE_DOCUMENT_SELECT,
  });

  return rows.map(toKnowledgeDocumentRecord);
}
