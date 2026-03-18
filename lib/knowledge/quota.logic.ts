/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import {
  isKnowledgeTier,
  type KnowledgeTier,
  type KnowledgeUsageSnapshot,
} from "@/types/knowledge";

interface KnowledgeTierLimits {
  maxDocuments: number;
  maxUploadBytes: number;
  embeddingCharsLimit: number;
}

export const KNOWLEDGE_TIER_LIMITS: Record<KnowledgeTier, KnowledgeTierLimits> =
  {
    free: {
      maxDocuments: 20,
      maxUploadBytes: 2 * 1024 * 1024,
      embeddingCharsLimit: 250_000,
    },
    pro: {
      maxDocuments: 50,
      maxUploadBytes: 5 * 1024 * 1024,
      embeddingCharsLimit: 1_000_000,
    },
    premium: {
      maxDocuments: 100,
      maxUploadBytes: 10 * 1024 * 1024,
      embeddingCharsLimit: 3_000_000,
    },
  };

export function getKnowledgeTierLimits(tier: string): KnowledgeTierLimits {
  const normalizedTier = isKnowledgeTier(tier) ? tier : "free";

  return KNOWLEDGE_TIER_LIMITS[normalizedTier];
}

export async function getUserKnowledgeUsage(userId: string) {
  const [user, activeDocuments] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        tier: true,
        knowledgeCharsUsed: true,
        knowledgeUploadsUsed: true,
      },
    }),
    prisma.document.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    activeDocuments,
    embeddingCharsUsed: user.knowledgeCharsUsed,
    tier: isKnowledgeTier(user.tier) ? user.tier : "free",
    uploadCountUsed: user.knowledgeUploadsUsed,
  };
}

export function buildKnowledgeUsageSnapshot(input: {
  activeDocuments: number;
  embeddingCharsUsed: number;
  tier: KnowledgeTier;
  uploadCountUsed: number;
}): KnowledgeUsageSnapshot {
  const limits = getKnowledgeTierLimits(input.tier);

  return {
    activeDocuments: input.activeDocuments,
    uploadCountUsed: input.uploadCountUsed,
    embeddingCharsUsed: input.embeddingCharsUsed,
    embeddingCharsLimit: limits.embeddingCharsLimit,
    maxDocuments: limits.maxDocuments,
    maxUploadBytes: limits.maxUploadBytes,
    tier: input.tier,
  };
}

export function assertUploadAllowed(input: {
  activeDocuments: number;
  fileSizeBytes: number;
  tier: string;
}) {
  const limits = getKnowledgeTierLimits(input.tier);

  if (input.activeDocuments >= limits.maxDocuments) {
    throw new Error("Document limit reached for your plan.");
  }

  if (input.fileSizeBytes > limits.maxUploadBytes) {
    throw new Error("File exceeds the upload size limit for your plan.");
  }

  return limits;
}

export function assertEmbeddingAllowed(input: {
  extractedCharCount: number;
  embeddingCharsUsed: number;
  tier: string;
}) {
  const limits = getKnowledgeTierLimits(input.tier);

  if (
    input.embeddingCharsUsed + input.extractedCharCount >
    limits.embeddingCharsLimit
  ) {
    throw new Error("Embedding usage limit reached for your plan.");
  }

  return limits;
}
