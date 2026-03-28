/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export interface KnowledgeDocumentSummary {
  id: string;
  name: string;
  charCount: number;
  createdAt: Date;
}

/**
 * Returns all KnowledgeDocument records for the given user,
 * ordered newest first.
 */
export async function listKnowledgeDocuments(
  userId: string,
): Promise<KnowledgeDocumentSummary[]> {
  return db.knowledgeDocument.findMany({
    where: { userId },
    select: { id: true, name: true, charCount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}
