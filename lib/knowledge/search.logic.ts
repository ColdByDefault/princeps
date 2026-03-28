/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { embedText } from "@/lib/knowledge/embed.logic";

export interface KnowledgeChunkResult {
  id: string;
  content: string;
  chunkIndex: number;
}

/**
 * Embeds the query string and returns the top-k most similar
 * KnowledgeChunk rows for the given user via pgvector cosine similarity.
 */
export async function searchKnowledge(
  userId: string,
  query: string,
  topK: number,
): Promise<KnowledgeChunkResult[]> {
  let embedding: number[];

  try {
    embedding = await embedText(query);
  } catch {
    // If the embed model is unavailable, degrade gracefully — return nothing.
    return [];
  }

  const vector = `[${embedding.join(",")}]`;

  const rows = await db.$queryRawUnsafe<KnowledgeChunkResult[]>(
    `SELECT id, content, "chunkIndex"
     FROM knowledge_chunk
     WHERE "userId" = $1
     ORDER BY embedding <=> $2::vector
     LIMIT $3`,
    userId,
    vector,
    topK,
  );

  return rows;
}
