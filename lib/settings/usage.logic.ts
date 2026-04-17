/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { getPlanLimits, type Tier, type UsageSummary } from "@/types/billing";

export async function getUserUsage(userId: string): Promise<UsageSummary> {
  const [
    user,
    chatsStored,
    knowledgeDocsStored,
    contactsStored,
    tasksStored,
    meetingsStored,
    decisionsStored,
    goalsStored,
    memoryStored,
    counter,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tier: true, knowledgeCharsUsed: true },
    }),
    db.chat.count({ where: { userId } }),
    db.knowledgeDocument.count({ where: { userId } }),
    db.contact.count({ where: { userId } }),
    db.task.count({ where: { userId } }),
    db.meeting.count({ where: { userId } }),
    db.decision.count({ where: { userId } }),
    db.goal.count({ where: { userId } }),
    db.memoryEntry.count({ where: { userId } }),
    db.usageCounter.findUnique({
      where: { userId },
      select: {
        messageMonthlyCount: true,
        tokenMonthlyCount: true,
        toolMonthlyCount: true,
        prepPackMonthlyCount: true,
        briefingMonthlyCount: true,
        voiceRequestsDailyCount: true,
        voiceRequestsMonthlyCount: true,
        voiceSecondsMonthlyCount: true,
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
    contactsStored,
    contactsLimit: limits.contactsMax,
    tasksStored,
    tasksLimit: limits.tasksMax,
    meetingsStored,
    meetingsLimit: limits.meetingsMax,
    decisionsStored,
    decisionsLimit: limits.decisionsMax,
    goalsStored,
    goalsLimit: limits.goalsMax,
    memoryStored,
    memoryLimit: limits.memoryMax,
    prepPacksGenerated: counter?.prepPackMonthlyCount ?? 0,
    prepPacksLimit: limits.prepPacksPerMonth,
    briefingsGenerated: counter?.briefingMonthlyCount ?? 0,
    briefingsLimit: limits.briefingsPerMonth,
    voiceRequestsUsed: counter?.voiceRequestsDailyCount ?? 0,
    voiceRequestsLimit: limits.voiceRequestsPerDay,
    voiceRequestsMonthlyUsed: counter?.voiceRequestsMonthlyCount ?? 0,
    voiceRequestsMonthlyLimit: limits.voiceRequestsPerMonth,
    voiceMinutesUsed:
      Math.round(((counter?.voiceSecondsMonthlyCount ?? 0) / 60) * 10) / 10,
    voiceMinutesLimit: limits.voiceMinutesPerMonth,
    monthlyResetDate:
      counter?.monthlyResetDate ?? new Date().toISOString().slice(0, 7),
  };
}
