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
import { embed } from "@/lib/llm-providers/provider";
import { accumulateTokens } from "@/lib/tiers/enforce";
import { normalizeVector, EMBEDDING_DIM } from "./shared.logic";

// ─── Types ────────────────────────────────────────────────

export interface KnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
}

// ─── Search ───────────────────────────────────────────────

/**
 * Runs a cosine similarity search over the user's knowledge chunks.
 * Returns the top-k most relevant chunks along with their source document name.
 *
 * Uses pgvector's <=> operator (cosine distance). Similarity = 1 − distance.
 * Only considers chunks whose embedding is non-null (fully indexed documents).
 *
 * @param userId  - Scopes results to the authenticated user.
 * @param query   - The natural-language query to embed and search against.
 * @param topK    - Maximum number of results to return (default 5).
 * @param minSimilarity - Minimum similarity threshold 0–1 (default 0.3).
 * @param sourceType - Optional filter by document source (e.g. "drive"). Omit to search all.
 */
export async function searchKnowledge(
  userId: string,
  query: string,
  topK = 5,
  minSimilarity = 0.3,
  sourceType?: string | null,
): Promise<KnowledgeSearchResult[]> {
  // Embed the query and normalize to the storage dimension
  const rawVector = await embed(query);
  // Fire-and-forget: count embedding input chars against the monthly token budget
  accumulateTokens(userId, query.length, 0).catch(() => {});
  const vector = normalizeVector(rawVector, EMBEDDING_DIM);
  const vectorLiteral = `[${vector.join(",")}]`;

  // Build optional source_type clause (param index 5 when present)
  const sourceClause = sourceType != null ? `AND kd.source_type = $5` : "";
  const queryParams: unknown[] = [userId, vectorLiteral, minSimilarity, topK];
  if (sourceType != null) queryParams.push(sourceType);

  // Raw SQL for pgvector similarity search with join to document name.
  // $queryRawUnsafe is used so the vector dimension stays as a SQL literal in
  // the type cast — PostgreSQL cannot accept parameters inside ::vector($N).
  const rows = await db.$queryRawUnsafe<
    {
      chunk_id: string;
      document_id: string;
      document_name: string;
      content: string;
      similarity: number;
    }[]
  >(
    `SELECT
      kc.id           AS chunk_id,
      kc."documentId" AS document_id,
      kd.name         AS document_name,
      kc.content,
      1 - (kc.embedding <=> $2::vector(1536)) AS similarity
    FROM knowledge_chunk kc
    JOIN knowledge_document kd ON kd.id = kc."documentId"
    WHERE kc."userId" = $1
      AND kc.embedding IS NOT NULL
      AND 1 - (kc.embedding <=> $2::vector(1536)) >= $3
      ${sourceClause}
    ORDER BY kc.embedding <=> $2::vector(1536)
    LIMIT $4`,
    ...queryParams,
  );

  return rows.map((r) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    documentName: r.document_name,
    content: r.content,
    similarity: Number(r.similarity),
  }));
}
