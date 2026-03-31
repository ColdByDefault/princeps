/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { chunkText } from "@/lib/knowledge/chunk.logic";
import { embedText } from "@/lib/knowledge/embed.logic";
import { getPlanLimits } from "@/types/billing";

const MAX_FILE_BYTES = 1_048_576; // 1 MB

export interface UploadResult {
  documentId: string;
  chunkCount: number;
  charCount: number;
}

/**
 * Full upload pipeline:
 *  1. Enforce size cap and quota limits.
 *  2. Chunk the text.
 *  3. Embed each chunk via Ollama.
 *  4. Persist KnowledgeDocument + KnowledgeChunk rows, update quota fields.
 *
 * The original file bytes are never stored — only chunks are persisted.
 */
export async function uploadKnowledgeDocument(
  userId: string,
  fileName: string,
  rawText: string,
): Promise<UploadResult> {
  // 1a. Size cap
  const byteSize = Buffer.byteLength(rawText, "utf8");
  if (byteSize > MAX_FILE_BYTES) {
    throw new UploadError("File exceeds the 1 MB size limit.", 400);
  }

  const charCount = rawText.length;

  // 1b. Quota check (tier-aware)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      knowledgeUploadsUsed: true,
      knowledgeCharsUsed: true,
    },
  });

  if (!user) throw new UploadError("User not found.", 401);

  const limits = getPlanLimits(user.tier);

  if (user.knowledgeUploadsUsed >= limits.knowledgeDocs) {
    throw new UploadError(
      "Document limit reached for your plan. Upgrade to upload more.",
      429,
    );
  }

  // 2. Chunk
  const chunks = chunkText(rawText);
  if (chunks.length === 0) {
    throw new UploadError("The file appears to be empty.", 400);
  }

  // 3. Embed all chunks
  const embeddings = await Promise.all(chunks.map((c) => embedText(c)));

  // 4. Persist — document row first, then chunks via raw SQL for the vector column
  const document = await db.knowledgeDocument.create({
    data: { userId, name: fileName, charCount },
  });

  for (let i = 0; i < chunks.length; i++) {
    const vector = `[${embeddings[i].join(",")}]`;
    await db.$executeRawUnsafe(
      `INSERT INTO knowledge_chunk (id, "documentId", "userId", content, embedding, "chunkIndex", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, $5, now())`,
      document.id,
      userId,
      chunks[i],
      vector,
      i,
    );
  }

  // Update quota counters
  await db.user.update({
    where: { id: userId },
    data: {
      knowledgeUploadsUsed: { increment: 1 },
      knowledgeCharsUsed: { increment: charCount },
    },
  });

  return { documentId: document.id, chunkCount: chunks.length, charCount };
}

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}
