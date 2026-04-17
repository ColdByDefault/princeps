/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getPlanLimits, type Tier } from "@/types/billing";

// ─── Types ────────────────────────────────────────────────

export interface EnforceResult {
  allowed: boolean;
  reason?: string;
}

// ─── Helpers ──────────────────────────────────────────────

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function getUserTier(userId: string): Promise<Tier> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true },
  });
  return user.tier as Tier;
}

/**
 * Returns the existing UsageCounter row for the user, or creates one on first
 * access. Creation uses upsert to tolerate concurrent first-time requests.
 */
async function getOrCreateCounter(userId: string) {
  return db.usageCounter.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

// ─── Chats per day ────────────────────────────────────────

/**
 * Checks whether the user is allowed to start a new chat today.
 * Increments the counter on success.
 */
export async function enforceChatsPerDay(
  userId: string,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const today = todayUtc();

  // Stale date → treat count as 0 (new day)
  const currentCount =
    counter.chatsDailyDate === today ? counter.chatsDailyCount : 0;

  if (currentCount >= limits.chatsPerDay) {
    return {
      allowed: false,
      reason: "Daily chat limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      chatsDailyCount: currentCount + 1,
      chatsDailyDate: today,
    },
  });

  return { allowed: true };
}

// ─── Widget chats per day ─────────────────────────────────

/**
 * Checks whether the user is allowed to send another widget chat message today.
 * Increments the counter on success. Widget chats and widget tool calls share
 * a single reset boundary (`widgetCountsDate`), so a stale date resets both.
 */
export async function enforceWidgetChats(
  userId: string,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const today = todayUtc();
  const stale = counter.widgetCountsDate !== today;

  const currentCount = stale ? 0 : counter.widgetChatsCount;

  if (currentCount >= limits.widgetChatsPerDay) {
    return {
      allowed: false,
      reason: "Daily widget chat limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      widgetChatsCount: currentCount + 1,
      // Reset the tools counter too when the day has rolled over
      widgetToolsCount: stale ? 0 : counter.widgetToolsCount,
      widgetCountsDate: today,
    },
  });

  return { allowed: true };
}

// ─── Widget tool calls per day ────────────────────────────

/**
 * Checks whether the user is allowed to invoke another widget tool call today.
 * Increments the counter on success. Shares the reset boundary with widget chats.
 */
export async function enforceWidgetTools(
  userId: string,
  count = 1,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const today = todayUtc();
  const stale = counter.widgetCountsDate !== today;

  const currentCount = stale ? 0 : counter.widgetToolsCount;

  if (currentCount + count > limits.widgetToolsPerDay) {
    return {
      allowed: false,
      reason: "Daily widget tool call limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      widgetToolsCount: currentCount + count,
      // Reset the chats counter too when the day has rolled over
      widgetChatsCount: stale ? 0 : counter.widgetChatsCount,
      widgetCountsDate: today,
    },
  });

  return { allowed: true };
}

// ─── Knowledge document slots ─────────────────────────────

/**
 * Checks whether the user is allowed to upload another knowledge document.
 * Enforces three independent limits:
 *
 *  1. `knowledgeDocs`        — maximum documents stored at rest (current count).
 *  2. `knowledgeFileSizeBytes` — maximum size of the file being uploaded.
 *  3. `knowledgeLifetimeChars` — lifetime chars ever processed (NEVER decremented,
 *     so delete-then-re-upload does not bypass the quota).
 *
 * Does NOT increment counters — the caller (createKnowledgeDocument) handles that
 * inside a transaction after the document is successfully persisted.
 */
export async function enforceKnowledgeUpload(
  userId: string,
  fileSizeBytes: number,
  newCharCount: number,
): Promise<EnforceResult> {
  const [tier, docCount, user] = await Promise.all([
    getUserTier(userId),
    db.knowledgeDocument.count({ where: { userId } }),
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { knowledgeCharsUsed: true },
    }),
  ]);

  const limits = getPlanLimits(tier);

  if (docCount >= limits.knowledgeDocs) {
    return {
      allowed: false,
      reason: "Knowledge document limit reached for your plan.",
    };
  }

  if (fileSizeBytes > limits.knowledgeFileSizeBytes) {
    const maxMB = (limits.knowledgeFileSizeBytes / 1_000_000).toFixed(1);
    return {
      allowed: false,
      reason: `File exceeds the ${maxMB} MB limit for your plan.`,
    };
  }

  if (user.knowledgeCharsUsed + newCharCount > limits.knowledgeLifetimeChars) {
    return {
      allowed: false,
      reason:
        "Lifetime knowledge character quota exhausted for your plan. Uploading more content is not possible on your current plan.",
    };
  }

  return { allowed: true };
}

/**
 * Checks whether the user is allowed to upload another knowledge document.
 * This is a slot limit (count-at-rest), not a daily counter —
 * no increment is performed here. The caller must create the document on success.
 * @deprecated Use enforceKnowledgeUpload() which checks all three limits.
 */
export async function enforceKnowledgeDocs(
  userId: string,
): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.knowledgeDocument.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (count >= limits.knowledgeDocs) {
    return {
      allowed: false,
      reason: "Knowledge document limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Chat history limit ───────────────────────────────────

/**
 * Returns the maximum number of chats that should be visible in the
 * user's history list. Consumers apply this as a `take` on list queries.
 */
export async function getChatHistoryLimit(userId: string): Promise<number> {
  const tier = await getUserTier(userId);
  return getPlanLimits(tier).chatHistoryTotal;
}

// ─── Monthly quota helpers ────────────────────────────────

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

// ─── Monthly limits (messages + tokens) ──────────────────

/**
 * Checks whether the user is within their monthly message and token budgets.
 * Increments the message counter on success. Token counter is updated
 * separately via accumulateTokens() after the assistant response completes.
 *
 * Also handles the monthly reset: when a new month is detected, both counters
 * are zeroed before the new count is written.
 */
export async function enforceMonthlyLimits(
  userId: string,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const month = currentMonth();
  const stale = counter.monthlyResetDate !== month;

  const currentMessages = stale ? 0 : counter.messageMonthlyCount;
  const currentTokens = stale ? 0 : counter.tokenMonthlyCount;

  if (currentMessages >= limits.messagesPerMonth) {
    return {
      allowed: false,
      reason: "Monthly message limit reached for your plan.",
    };
  }

  if (currentTokens >= limits.tokensPerMonth) {
    return {
      allowed: false,
      reason: "Monthly token budget exhausted for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      messageMonthlyCount: currentMessages + 1,
      // Zero out tokens on a new month before accumulation starts
      tokenMonthlyCount: stale ? 0 : currentTokens,
      monthlyResetDate: month,
    },
  });

  return { allowed: true };
}

// ─── Token accumulation ───────────────────────────────────

/**
 * Adds approximate token usage to the monthly counter after a response completes.
 * Uses the 1 token ≈ 4 characters heuristic — no cost calculation is performed.
 *
 * This is non-critical. Call it fire-and-forget (.catch(() => {})).
 * The row is guaranteed to exist at this point because enforceMonthlyLimits()
 * already called getOrCreateCounter() earlier in the same request.
 */
export async function accumulateTokens(
  userId: string,
  userMessageChars: number,
  assistantResponseChars: number,
  toolCallChars = 0,
): Promise<void> {
  const approxTokens = Math.ceil(
    (userMessageChars + assistantResponseChars + toolCallChars) / 4,
  );

  await db.usageCounter.update({
    where: { userId },
    data: { tokenMonthlyCount: { increment: approxTokens } },
  });
}

// ─── Tool call monthly limit ──────────────────────────────

/**
 * Checks whether the user is within their monthly tool call budget.
 * Increments the counter by the number of tool calls being invoked.
 *
 * Call this before executing tool calls in the stream.
 * Uses the same monthly reset boundary as messages/tokens.
 */
export async function enforceToolCallsMonthly(
  userId: string,
  count = 1,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const month = currentMonth();
  const stale = counter.monthlyResetDate !== month;

  const currentTools = stale ? 0 : counter.toolMonthlyCount;

  if (currentTools + count > limits.toolCallsPerMonth) {
    return {
      allowed: false,
      reason: "Monthly tool call limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: { toolMonthlyCount: currentTools + count },
  });

  return { allowed: true };
}

// ─── Prep pack monthly limit ──────────────────────────────

export async function enforcePrepPackMonthly(
  userId: string,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const month = currentMonth();
  const stale = counter.monthlyResetDate !== month;

  if (limits.prepPacksPerMonth === 0) {
    return {
      allowed: false,
      reason: "Meeting prep pack generation is not available on your plan.",
    };
  }

  const current = stale ? 0 : counter.prepPackMonthlyCount;

  if (current >= limits.prepPacksPerMonth) {
    return {
      allowed: false,
      reason: "Monthly prep pack limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      prepPackMonthlyCount: current + 1,
      monthlyResetDate: month,
    },
  });

  return { allowed: true };
}

// ─── Voice input daily limit ──────────────────────────────

/**
 * Checks whether the user is allowed to make another voice transcription
 * request today. `0` = feature disabled for this tier (free).
 * Shares the `widgetCountsDate` daily reset boundary with widget counters.
 */
export async function enforceVoiceRequests(
  userId: string,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.voiceRequestsPerDay === 0) {
    return {
      allowed: false,
      reason:
        "Voice input is not available on the free plan. Upgrade to Pro or above.",
    };
  }

  // ── Daily gate ────────────────────────────────────────────
  const today = todayUtc();
  const staleDay = counter.widgetCountsDate !== today;
  const currentDaily = staleDay ? 0 : counter.voiceRequestsDailyCount;

  if (currentDaily >= limits.voiceRequestsPerDay) {
    return {
      allowed: false,
      reason: "Daily voice input limit reached for your plan.",
    };
  }

  // ── Monthly gates ─────────────────────────────────────────
  const month = currentMonth();
  const staleMonth = counter.monthlyResetDate !== month;
  const currentMonthlyReqs = staleMonth ? 0 : counter.voiceRequestsMonthlyCount;
  const currentMonthlySeconds = staleMonth
    ? 0
    : counter.voiceSecondsMonthlyCount;
  const currentMonthlyMinutes = currentMonthlySeconds / 60;

  if (currentMonthlyReqs >= limits.voiceRequestsPerMonth) {
    return {
      allowed: false,
      reason: "Monthly voice input request limit reached for your plan.",
    };
  }

  if (currentMonthlyMinutes >= limits.voiceMinutesPerMonth) {
    return {
      allowed: false,
      reason: "Monthly voice transcription minute limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      voiceRequestsDailyCount: currentDaily + 1,
      widgetCountsDate: today,
      voiceRequestsMonthlyCount: currentMonthlyReqs + 1,
      voiceSecondsMonthlyCount: staleMonth ? 0 : currentMonthlySeconds,
      monthlyResetDate: month,
    },
  });

  return { allowed: true };
}

/**
 * Records the actual transcription duration after a successful request.
 * Call fire-and-forget after the OpenAI response returns — never blocks the user.
 */
export async function recordVoiceDuration(
  userId: string,
  durationSeconds: number,
): Promise<void> {
  const roundedSeconds = Math.round(durationSeconds);
  if (roundedSeconds <= 0) return;

  await db.usageCounter.updateMany({
    where: { userId },
    data: {
      voiceSecondsMonthlyCount: { increment: roundedSeconds },
    },
  });
}

// ─── Contacts limit ───────────────────────────────────────

/**
 * Checks whether the user is allowed to generate another briefing.
 * Enforces two independent gates:
 *  1. Daily burst guard (`briefingsPerDay`) — resets each UTC day.
 *  2. Monthly quota (`briefingsPerMonth`) — resets each calendar month.
 * Both counters are incremented on success.
 * `-1` = unlimited for that gate.
 */
export async function enforceBriefingMonthly(
  userId: string,
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const today = todayUtc();
  const month = currentMonth();
  const staleDay = counter.briefingDailyDate !== today;
  const staleMonth = counter.monthlyResetDate !== month;

  if (limits.briefingsPerMonth === 0) {
    return {
      allowed: false,
      reason: "Daily briefing generation is not available on your plan.",
    };
  }

  // ── Daily burst guard ──────────────────────────────────
  if (limits.briefingsPerDay !== -1) {
    const dailyCurrent = staleDay ? 0 : counter.briefingDailyCount;
    if (dailyCurrent >= limits.briefingsPerDay) {
      return {
        allowed: false,
        reason:
          "Daily briefing regeneration limit reached. Try again tomorrow.",
      };
    }
  }

  // ── Monthly quota ──────────────────────────────────────
  if (limits.briefingsPerMonth !== -1) {
    const monthlyCurrent = staleMonth ? 0 : counter.briefingMonthlyCount;
    if (monthlyCurrent >= limits.briefingsPerMonth) {
      return {
        allowed: false,
        reason: "Monthly briefing limit reached for your plan.",
      };
    }
  }

  // ── Increment both ─────────────────────────────────────
  await db.usageCounter.update({
    where: { userId },
    data: {
      briefingDailyCount: staleDay ? 1 : { increment: 1 },
      briefingDailyDate: today,
      ...(limits.briefingsPerMonth !== -1
        ? {
            briefingMonthlyCount: staleMonth ? 1 : { increment: 1 },
            monthlyResetDate: month,
          }
        : {}),
    },
  });

  return { allowed: true };
}

/**
 * Checks whether the user is allowed to create another contact.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the contact on success.
 */
export async function enforceContactsMax(
  userId: string,
): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.contact.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.contactsMax !== -1 && count >= limits.contactsMax) {
    return {
      allowed: false,
      reason: "Contact limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Tasks limit ──────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another task.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the task on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceTasksMax(userId: string): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.task.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.tasksMax !== -1 && count >= limits.tasksMax) {
    return {
      allowed: false,
      reason: "Task limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Meetings limit ───────────────────────────────────────

/**
 * Checks whether the user is allowed to create another meeting.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the meeting on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceMeetingsMax(
  userId: string,
): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.meeting.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.meetingsMax !== -1 && count >= limits.meetingsMax) {
    return {
      allowed: false,
      reason: "Meeting limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Decisions limit ──────────────────────────────────────

/**
 * Checks whether the user is allowed to create another decision.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the decision on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceDecisionsMax(
  userId: string,
): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.decision.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.decisionsMax !== -1 && count >= limits.decisionsMax) {
    return {
      allowed: false,
      reason: "Decision limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Goals limit ─────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another goal.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the goal on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceGoalsMax(userId: string): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.goal.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.goalsMax !== -1 && count >= limits.goalsMax) {
    return {
      allowed: false,
      reason: "Goal limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Memory limit ─────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another memory entry.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the entry on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceMemoryMax(userId: string): Promise<EnforceResult> {
  const [tier, count] = await Promise.all([
    getUserTier(userId),
    db.memoryEntry.count({ where: { userId } }),
  ]);

  const limits = getPlanLimits(tier);

  if (limits.memoryMax !== -1 && count >= limits.memoryMax) {
    return {
      allowed: false,
      reason: "Memory entry limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Response factory ─────────────────────────────────────
export function createTierLimitResponse(reason = "Plan limit reached.") {
  return NextResponse.json({ error: reason }, { status: 403 });
}
