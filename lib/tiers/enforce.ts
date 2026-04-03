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
): Promise<EnforceResult> {
  const [tier, counter] = await Promise.all([
    getUserTier(userId),
    getOrCreateCounter(userId),
  ]);

  const limits = getPlanLimits(tier);
  const today = todayUtc();
  const stale = counter.widgetCountsDate !== today;

  const currentCount = stale ? 0 : counter.widgetToolsCount;

  if (currentCount >= limits.widgetToolsPerDay) {
    return {
      allowed: false,
      reason: "Daily widget tool call limit reached for your plan.",
    };
  }

  await db.usageCounter.update({
    where: { userId },
    data: {
      widgetToolsCount: currentCount + 1,
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
 * This is a slot limit (count-at-rest), not a daily counter —
 * no increment is performed here. The caller must create the document on success.
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

// ─── Response factory ─────────────────────────────────────

/**
 * Produces a 403 JSON response for a blocked tier enforcement check.
 * Use `result.reason` as the message when available.
 */
export function createTierLimitResponse(reason = "Plan limit reached.") {
  return NextResponse.json({ error: reason }, { status: 403 });
}
