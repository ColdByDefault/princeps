/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import { embedKnowledgeText } from "@/lib/knowledge/embed.logic";

export interface KnowledgeRetrievalChunk {
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

export async function retrieveKnowledgeChunks(input: {
  query: string;
  topK?: number;
  userId: string;
}) {
  const queryEmbedding = await embedKnowledgeText(input.query);
  const vector = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe<KnowledgeRetrievalChunk[]>(
    `SELECT
       dc."documentId" AS "documentId",
       d.title AS "documentTitle",
       dc.content,
       1 - (dc.embedding <=> $1::vector) AS similarity
     FROM document_chunk dc
     JOIN document d ON d.id = dc."documentId"
     WHERE d."userId" = $2
       AND d.status = 'ready'
     ORDER BY dc.embedding <=> $1::vector
     LIMIT $3`,
    vector,
    input.userId,
    input.topK ?? 5,
  );

  return results.filter((result) => result.similarity > 0);
}
