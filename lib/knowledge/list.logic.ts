/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  buildKnowledgeUsageSnapshot,
  getUserKnowledgeUsage,
} from "@/lib/knowledge/quota.logic";
import { knowledgeDocumentListSelect } from "@/lib/knowledge/shared.logic";
import {
  isKnowledgeDocumentPriority,
  type KnowledgeDocumentPriority,
} from "@/types/knowledge";

function isMissingColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2022"
  );
}

export async function listKnowledgeDocuments(
  userId: string,
  input: {
    priority?: string | null;
    tag?: string | null;
  },
) {
  const priority = isKnowledgeDocumentPriority(input.priority)
    ? (input.priority as KnowledgeDocumentPriority)
    : undefined;
  const tag = input.tag?.trim() || undefined;
  const usage = await getUserKnowledgeUsage(userId);

  try {
    const documents = await prisma.document.findMany({
      where: {
        userId,
        ...(priority ? { priority } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: knowledgeDocumentListSelect,
    });

    return {
      documents,
      usage: buildKnowledgeUsageSnapshot(usage),
      error: null,
    };
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    return {
      documents: [],
      usage: buildKnowledgeUsageSnapshot(usage),
      error:
        "Database schema is out of sync. Run npm run db:push and reload the page.",
    };
  }
}
