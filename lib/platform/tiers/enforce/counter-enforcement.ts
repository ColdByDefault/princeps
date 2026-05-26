/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.2.1
 */

import "server-only";

import { db } from "@/lib/core/db";

import {
  currentMonth,
  getLimitsAndCounter,
  getLimitsForUser,
  todayUtc,
} from "./helpers";
import type { EnforceResult } from "./types";

// ─── Chats per day ────────────────────────────────────────

/**
 * Checks whether the user is allowed to start a new chat today.
 * Increments the counter on success.
 */
export async function enforceChatsPerDay(
  userId: string,
): Promise<EnforceResult> {
  const { limits, counter } = await getLimitsAndCounter(userId);
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
  const { limits, counter } = await getLimitsAndCounter(userId);

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
  const { limits, counter } = await getLimitsAndCounter(userId);

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

// ─── Chat history limit ───────────────────────────────────

/**
 * Returns the maximum number of chats that should be visible in the
 * user's history list. Consumers apply this as a `take` on list queries.
 */
export async function getChatHistoryLimit(userId: string): Promise<number> {
  const limits = await getLimitsForUser(userId);
  return limits.chatHistoryTotal;
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
  const { limits, counter } = await getLimitsAndCounter(userId);

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
  systemPromptChars = 0,
): Promise<void> {
  const approxTokens = Math.ceil(
    (userMessageChars +
      assistantResponseChars +
      toolCallChars +
      systemPromptChars) /
      4,
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
  const { limits, counter } = await getLimitsAndCounter(userId);

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
  const { limits, counter } = await getLimitsAndCounter(userId);

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
  const { limits, counter } = await getLimitsAndCounter(userId);

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

// ─── Briefings limit ──────────────────────────────────────

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
  const { limits, counter } = await getLimitsAndCounter(userId);

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
