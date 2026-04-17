/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { embedBatch } from "@/lib/llm-providers";
import { accumulateTokens } from "@/lib/tiers/enforce";
import {
  chunkText,
  normalizeVector,
  EMBEDDING_DIM,
  KNOWLEDGE_DOCUMENT_SELECT,
  toKnowledgeDocumentRecord,
} from "./shared.logic";
import type { CreateKnowledgeDocumentInput } from "./schemas";
import type { KnowledgeDocumentRecord } from "@/types/api";

// ─── Create ───────────────────────────────────────────────

/**
 * Processes a text document upload:
 *  1. Splits the text into overlapping chunks.
 *  2. Embeds all chunks in a single batch request.
 *  3. Persists the KnowledgeDocument, all KnowledgeChunks with embeddings,
 *     and increments the user's lifetime counters atomically.
 *
 * The original file content is NEVER stored — only the chunks.
 * Call enforceKnowledgeUpload() BEFORE calling this function.
 */
export async function createKnowledgeDocument(
  userId: string,
  input: CreateKnowledgeDocumentInput,
): Promise<KnowledgeDocumentRecord> {
  const { name, content } = input;
  const charCount = content.length;

  // 1. Chunk text
  const rawChunks = chunkText(content);

  // 2. Embed all chunks in one batch
  const rawVectors = await embedBatch(rawChunks);
  // Fire-and-forget: count embedding input chars against the monthly token budget
  const totalChunkChars = rawChunks.reduce((sum, c) => sum + c.length, 0);
  accumulateTokens(userId, totalChunkChars, 0).catch(() => {});
  const vectors = rawVectors.map((v) => normalizeVector(v, EMBEDDING_DIM));

  // 3. Persist document + chunks + lifetime counters in a transaction.
  // timeout is raised to 30 s because inserting many chunks sequentially
  // via $executeRawUnsafe can exceed the 5 s default for large documents.
  const doc = await db.$transaction(
    async (tx) => {
      // Create the document record
      const document = await tx.knowledgeDocument.create({
        data: {
          userId,
          name,
          charCount,
        },
        select: { id: true },
      });

      // Insert chunks with embeddings via raw SQL (Prisma can't write vector type).
      // $executeRawUnsafe is used so that the vector dimension (1536) stays as a
      // SQL literal in the type cast — PostgreSQL cannot accept parameters inside
      // type casts like ::vector($N).
      for (let i = 0; i < rawChunks.length; i++) {
        const chunk = rawChunks[i]!;
        const vector = vectors[i]!;
        const vectorLiteral = `[${vector.join(",")}]`;

        await tx.$executeRawUnsafe(
          `INSERT INTO "knowledge_chunk" ("id", "documentId", "userId", "content", "embedding", "chunkIndex", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector(1536), $5, NOW())`,
          document.id,
          userId,
          chunk,
          vectorLiteral,
          i,
        );
      }

      // Increment lifetime counters (never decremented — the bypass guard)
      await tx.user.update({
        where: { id: userId },
        data: {
          knowledgeCharsUsed: { increment: charCount },
          knowledgeUploadsUsed: { increment: 1 },
        },
      });

      return document;
    },
    { timeout: 30_000 },
  );

  // Fetch the full record to return
  const row = await db.knowledgeDocument.findUniqueOrThrow({
    where: { id: doc.id },
    select: KNOWLEDGE_DOCUMENT_SELECT,
  });

  return toKnowledgeDocumentRecord(row);
}
