/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getPlanLimits, type Tier, type UsageSummary } from "@/types/billing";

export async function getUserUsage(userId: string): Promise<UsageSummary> {
  const [user, chatsStored, knowledgeDocsStored, counter] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tier: true, knowledgeCharsUsed: true },
    }),
    db.chat.count({ where: { userId } }),
    db.knowledgeDocument.count({ where: { userId } }),
    db.usageCounter.findUnique({
      where: { userId },
      select: {
        messageMonthlyCount: true,
        tokenMonthlyCount: true,
        toolMonthlyCount: true,
        monthlyResetDate: true,
      },
    }),
  ]);

  const tier = user.tier as Tier;
  const limits = getPlanLimits(tier);

  return {
    tier,
    messagesUsed: counter?.messageMonthlyCount ?? 0,
    messagesLimit: limits.messagesPerMonth,
    tokensUsed: counter?.tokenMonthlyCount ?? 0,
    tokensLimit: limits.tokensPerMonth,
    chatsStored,
    chatsLimit: limits.chatHistoryTotal,
    toolCallsUsed: counter?.toolMonthlyCount ?? 0,
    toolCallsLimit: limits.toolCallsPerMonth,
    knowledgeDocsStored,
    knowledgeDocsLimit: limits.knowledgeDocs,
    knowledgeCharsUsed: user.knowledgeCharsUsed,
    knowledgeCharsLimit: limits.knowledgeLifetimeChars,
    monthlyResetDate:
      counter?.monthlyResetDate ?? new Date().toISOString().slice(0, 7),
  };
}
