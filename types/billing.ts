/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export type Tier = "free" | "pro" | "premium" | "enterprise";

export interface PlanLimits {
  /** Max total knowledge documents stored at once (no monthly reset). */
  knowledgeDocs: number;
  /** Max total chats stored at once (no monthly reset). */
  chatHistoryTotal: number;
  /** Max new chats created per calendar day — spam burst guard only. */
  chatsPerDay: number;
  /** Max LLM messages sent per calendar month — primary quota gate. */
  messagesPerMonth: number;
  /**
   * Max approximate tokens consumed per calendar month.
   * Estimated server-side as Math.ceil(chars / 4) — no cost tracking.
   */
  tokensPerMonth: number;
  /** Max widget chat messages per calendar day. */
  widgetChatsPerDay: number;
  /** Max widget tool calls per calendar day. */
  widgetToolsPerDay: number;
  /** Max LLM tool calls (function calls) per calendar month in main chat. */
  toolCallsPerMonth: number;
  /** Whether proactive nudge notifications are active. */
  nudgesEnabled: boolean;
}

/**
 * Limit values are calibrated against GPT-4o pricing (~$0.0075 / exchange).
 *
 *   free       ≈ $0.50 / month
 *   pro        ≈ $2.00 / month
 *   premium    ≈ $5.00 / month
 *   enterprise ≈ $15.00 / month
 */
export const PLAN_LIMITS: Record<Tier, PlanLimits> = {
  free: {
    knowledgeDocs: 3,
    chatHistoryTotal: 10,
    chatsPerDay: 3,
    messagesPerMonth: 75,
    tokensPerMonth: 125_000,
    widgetChatsPerDay: 30,
    widgetToolsPerDay: 5,
    toolCallsPerMonth: 50,
    nudgesEnabled: false,
  },
  pro: {
    knowledgeDocs: 25,
    chatHistoryTotal: 25,
    chatsPerDay: 5,
    messagesPerMonth: 250,
    tokensPerMonth: 400_000,
    widgetChatsPerDay: 60,
    widgetToolsPerDay: 25,
    toolCallsPerMonth: 200,
    nudgesEnabled: true,
  },
  premium: {
    knowledgeDocs: 50,
    chatHistoryTotal: 50,
    chatsPerDay: 10,
    messagesPerMonth: 650,
    tokensPerMonth: 1_000_000,
    widgetChatsPerDay: 120,
    widgetToolsPerDay: 50,
    toolCallsPerMonth: 500,
    nudgesEnabled: true,
  },
  enterprise: {
    knowledgeDocs: 200,
    chatHistoryTotal: 200,
    chatsPerDay: 20,
    messagesPerMonth: 2_000,
    tokensPerMonth: 3_000_000,
    widgetChatsPerDay: 300,
    widgetToolsPerDay: 100,
    toolCallsPerMonth: 2_000,
    nudgesEnabled: true,
  },
};

/**
 * Returns the plan limits for the given tier.
 * Falls back to `free` as a runtime safety net.
 */
export function getPlanLimits(tier: Tier): PlanLimits {
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;
}

// ─── Usage summary ────────────────────────────────────────

/**
 * Snapshot of a user's current quota consumption.
 * Produced server-side by lib/settings/usage.logic.ts and passed as a prop
 * to the Settings Usage tab. Safe to cross the server/client boundary.
 */
export interface UsageSummary {
  tier: Tier;
  messagesUsed: number;
  messagesLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  chatsStored: number;
  chatsLimit: number;
  toolCallsUsed: number;
  toolCallsLimit: number;
  /** "YYYY-MM" string of the current billing month, or null if never tracked. */
  monthlyResetDate: string | null;
}
