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

  const [documents, usage] = await Promise.all([
    prisma.document.findMany({
      where: {
        userId,
        ...(priority ? { priority } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: knowledgeDocumentListSelect,
    }),
    getUserKnowledgeUsage(userId),
  ]);

  return {
    documents,
    usage: buildKnowledgeUsageSnapshot(usage),
  };
}
