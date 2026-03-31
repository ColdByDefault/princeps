/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getPlanLimits } from "@/types/billing";

// ─── Types ────────────────────────────────────────────────

export type PlanResource =
  | "knowledge_docs"
  | "chat_history"
  | "chat_daily"
  | "widget_chats_daily"
  | "widget_tools_daily";

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public readonly resource: PlanResource,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

// ─── Helpers ──────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── Plan enforcement ─────────────────────────────────────

/**
 * Asserts the user has not exceeded their plan limit for the given resource.
 * Throws `PlanLimitError` when the limit is reached.
 *
 * Does NOT increment any counters — call the increment helpers separately
 * after the operation succeeds.
 */
export async function assertWithinPlan(
  userId: string,
  resource: PlanResource,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      knowledgeUploadsUsed: true,
      chatsDailyCount: true,
      chatsDailyDate: true,
      widgetChatsCount: true,
      widgetToolsCount: true,
      widgetCountsDate: true,
    },
  });

  if (!user) {
    throw new PlanLimitError("User not found.", resource);
  }

  const limits = getPlanLimits(user.tier);
  const today = todayUTC();

  switch (resource) {
    case "knowledge_docs": {
      if (user.knowledgeUploadsUsed >= limits.knowledgeDocs) {
        throw new PlanLimitError(
          "Document limit reached for your plan. Upgrade to upload more.",
          resource,
        );
      }
      break;
    }

    case "chat_daily": {
      const count = user.chatsDailyDate === today ? user.chatsDailyCount : 0;
      if (count >= limits.chatsPerDay) {
        throw new PlanLimitError(
          "Daily chat creation limit reached. Try again tomorrow.",
          resource,
        );
      }
      break;
    }

    case "widget_chats_daily": {
      const count = user.widgetCountsDate === today ? user.widgetChatsCount : 0;
      if (count >= limits.widgetChatsPerDay) {
        throw new PlanLimitError(
          "Daily widget chat limit reached. Try again tomorrow.",
          resource,
        );
      }
      break;
    }

    case "widget_tools_daily": {
      const count = user.widgetCountsDate === today ? user.widgetToolsCount : 0;
      if (count >= limits.widgetToolsPerDay) {
        throw new PlanLimitError(
          "Daily widget tool limit reached. Try again tomorrow.",
          resource,
        );
      }
      break;
    }

    // chat_history is checked live via a count() query in createChat — no-op here.
    case "chat_history":
      break;
  }
}

// ─── Counter helpers ──────────────────────────────────────

/**
 * Increments the daily chat creation counter for `userId`.
 * Resets the counter when the stored date differs from today (UTC).
 */
export async function incrementChatDailyCounter(userId: string): Promise<void> {
  const today = todayUTC();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { chatsDailyDate: true },
  });
  if (!user) return;

  if (user.chatsDailyDate === today) {
    await db.user.update({
      where: { id: userId },
      data: { chatsDailyCount: { increment: 1 } },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: { chatsDailyCount: 1, chatsDailyDate: today },
    });
  }
}

/**
 * Checks whether the user can make another widget chat request today.
 * If allowed, immediately increments the widget chat counter and returns
 * the remaining tool quota for this request.
 *
 * Use this at the top of `POST /api/chat/widget` to do a single DB round-trip
 * that both guards and consumes quota.
 */
export async function checkAndConsumeWidgetChat(
  userId: string,
): Promise<{ allowed: false } | { allowed: true; remainingToolQuota: number }> {
  const today = todayUTC();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      widgetChatsCount: true,
      widgetToolsCount: true,
      widgetCountsDate: true,
    },
  });

  if (!user) return { allowed: false };

  const limits = getPlanLimits(user.tier);
  const isSameDay = user.widgetCountsDate === today;
  const chatCount = isSameDay ? user.widgetChatsCount : 0;
  const toolCount = isSameDay ? user.widgetToolsCount : 0;

  if (chatCount >= limits.widgetChatsPerDay) {
    return { allowed: false };
  }

  const remainingToolQuota = Math.max(0, limits.widgetToolsPerDay - toolCount);

  // Increment the chat counter (reset both if new day)
  if (isSameDay) {
    await db.user.update({
      where: { id: userId },
      data: { widgetChatsCount: { increment: 1 } },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: {
        widgetChatsCount: 1,
        widgetToolsCount: 0,
        widgetCountsDate: today,
      },
    });
  }

  return { allowed: true, remainingToolQuota };
}

/**
 * Increments the widget tool counter for `userId` by `count`.
 * Should be called after tool calls are executed in the widget stream.
 */
export async function incrementWidgetToolCounter(
  userId: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;
  await db.user.update({
    where: { id: userId },
    data: { widgetToolsCount: { increment: count } },
  });
}
