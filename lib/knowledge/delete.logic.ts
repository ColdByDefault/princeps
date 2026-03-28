/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

/**
 * Deletes a KnowledgeDocument and cascades to its chunks.
 * Also decrements the user's quota counters.
 * Returns false if the document does not exist or belongs to a different user.
 */
export async function deleteKnowledgeDocument(
  userId: string,
  documentId: string,
): Promise<boolean> {
  const document = await db.knowledgeDocument.findUnique({
    where: { id: documentId },
    select: { userId: true, charCount: true },
  });

  if (!document || document.userId !== userId) {
    return false;
  }

  await db.knowledgeDocument.delete({ where: { id: documentId } });

  await db.user.update({
    where: { id: userId },
    data: {
      knowledgeUploadsUsed: { decrement: 1 },
      knowledgeCharsUsed: { decrement: document.charCount },
    },
  });

  return true;
}
