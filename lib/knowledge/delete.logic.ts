/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";

// ─── Delete ───────────────────────────────────────────────

/**
 * Deletes a knowledge document and ALL its chunks (via cascade).
 * NOTE: The user's lifetime counters (knowledgeCharsUsed, knowledgeUploadsUsed)
 * are intentionally NOT decremented — they are the bypass-prevention gate.
 *
 * Returns false if the document does not exist or belongs to a different user.
 */
export async function deleteKnowledgeDocument(
  userId: string,
  documentId: string,
): Promise<boolean> {
  const doc = await db.knowledgeDocument.findUnique({
    where: { id: documentId },
    select: { userId: true },
  });

  if (!doc || doc.userId !== userId) return false;

  await db.knowledgeDocument.delete({ where: { id: documentId } });

  return true;
}
