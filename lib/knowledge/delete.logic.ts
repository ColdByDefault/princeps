/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";

export async function deleteKnowledgeDocument(
  userId: string,
  documentId: string,
) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  await prisma.document.delete({
    where: {
      id: document.id,
    },
  });
}
