/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import { chunkKnowledgeText } from "@/lib/knowledge/chunk.logic";
import { embedKnowledgeBatch } from "@/lib/knowledge/embed.logic";
import { knowledgeDocumentListSelect } from "@/lib/knowledge/shared.logic";

export async function reindexKnowledgeDocument(
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
      textContent: true,
    },
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  const normalizedText = document.textContent.trim();

  if (!normalizedText) {
    throw new Error("Document re-index failed.");
  }

  const chunks = chunkKnowledgeText(normalizedText);

  if (chunks.length === 0) {
    throw new Error("Document re-index failed.");
  }

  await prisma.document.update({
    where: { id: document.id },
    data: {
      status: "processing",
      lastError: null,
      indexedAt: null,
      chunkCount: chunks.length,
    },
  });

  try {
    const embeddings = await embedKnowledgeBatch(chunks);

    await prisma.$transaction(async (tx) => {
      await tx.documentChunk.deleteMany({
        where: {
          documentId: document.id,
        },
      });

      for (let index = 0; index < chunks.length; index++) {
        const vector = `[${embeddings[index].join(",")}]`;

        await tx.$executeRawUnsafe(
          `INSERT INTO document_chunk (id, "documentId", content, "chunkIndex", embedding, "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())`,
          document.id,
          chunks[index],
          index,
          vector,
        );
      }

      await tx.document.update({
        where: { id: document.id },
        data: {
          status: "ready",
          chunkCount: chunks.length,
          indexedAt: new Date(),
          lastError: null,
        },
      });
    });
  } catch (error) {
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: "failed",
        indexedAt: null,
        lastError:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Document re-index failed.",
      },
    });

    throw new Error("Document re-index failed.");
  }

  return prisma.document.findUniqueOrThrow({
    where: { id: document.id },
    select: knowledgeDocumentListSelect,
  });
}
