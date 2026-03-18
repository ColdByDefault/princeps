/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import { chunkKnowledgeText } from "@/lib/knowledge/chunk.logic";
import { embedKnowledgeBatch } from "@/lib/knowledge/embed.logic";
import { extractKnowledgeText } from "@/lib/knowledge/extract.logic";
import {
  assertEmbeddingAllowed,
  assertUploadAllowed,
  getUserKnowledgeUsage,
} from "@/lib/knowledge/quota.logic";
import { knowledgeDocumentListSelect } from "@/lib/knowledge/shared.logic";
import { normalizeOptionalText, normalizeTagList } from "@/lib/security";
import {
  isKnowledgeDocumentPriority,
  isKnowledgeSourceType,
} from "@/types/knowledge";

export async function uploadKnowledgeDocument(
  userId: string,
  formData: FormData,
) {
  const title = normalizeOptionalText(
    typeof formData.get("title") === "string"
      ? (formData.get("title") as string)
      : null,
    160,
  );
  const sourceTypeValue =
    typeof formData.get("sourceType") === "string"
      ? (formData.get("sourceType") as string)
      : null;
  const file = formData.get("file");
  const priorityValue =
    typeof formData.get("priority") === "string"
      ? (formData.get("priority") as string)
      : "medium";
  const tags = normalizeTagList(
    typeof formData.get("tags") === "string"
      ? (formData.get("tags") as string).split(",")
      : [],
  );

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!isKnowledgeSourceType(sourceTypeValue)) {
    throw new Error("Unsupported knowledge source type.");
  }

  if (!isKnowledgeDocumentPriority(priorityValue)) {
    throw new Error("Invalid document priority.");
  }

  if (!(file instanceof File)) {
    throw new Error("File is required.");
  }

  const usage = await getUserKnowledgeUsage(userId);
  assertUploadAllowed({
    activeDocuments: usage.activeDocuments,
    fileSizeBytes: file.size,
    tier: usage.tier,
  });

  const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
  const extractedText = await extractKnowledgeText(sourceTypeValue, buffer);
  const normalizedText = extractedText.trim();

  if (!normalizedText) {
    throw new Error("No text content could be extracted.");
  }

  assertEmbeddingAllowed({
    extractedCharCount: normalizedText.length,
    embeddingCharsUsed: usage.embeddingCharsUsed,
    tier: usage.tier,
  });

  const chunks = chunkKnowledgeText(normalizedText);

  if (chunks.length === 0) {
    throw new Error("Document content could not be chunked.");
  }

  const document = await prisma.document.create({
    data: {
      userId,
      title,
      fileName: file.name || null,
      mimeType: file.type || null,
      fileSizeBytes: file.size,
      sourceType: sourceTypeValue,
      textContent: normalizedText,
      tags,
      priority: priorityValue,
      status: "processing",
      charCount: normalizedText.length,
      chunkCount: chunks.length,
      embeddingChars: normalizedText.length,
    },
    select: {
      id: true,
    },
  });

  try {
    const embeddings = await embedKnowledgeBatch(chunks);

    await prisma.$transaction(async (tx) => {
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
          indexedAt: new Date(),
          lastError: null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          knowledgeCharsUsed: {
            increment: normalizedText.length,
          },
          knowledgeUploadsUsed: {
            increment: 1,
          },
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
            : "Upload failed",
      },
    });

    throw error;
  }

  return prisma.document.findUniqueOrThrow({
    where: { id: document.id },
    select: knowledgeDocumentListSelect,
  });
}
