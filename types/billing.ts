/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export type Tier = "free" | "pro" | "premium";

export interface PlanLimits {
  /** Max total knowledge documents stored at once. */
  knowledgeDocs: number;
  /** Max total chats visible in history at once. */
  chatHistoryTotal: number;
  /** Max new chats created per calendar day (including deleted ones). */
  chatsPerDay: number;
  /** Max widget chat messages per calendar day. */
  widgetChatsPerDay: number;
  /** Max widget tool calls per calendar day. */
  widgetToolsPerDay: number;
  /** Whether proactive nudge notifications are active. */
  nudgesEnabled: boolean;
}

const PLAN_LIMITS: Record<Tier, PlanLimits> = {
  free: {
    knowledgeDocs: 3,
    chatHistoryTotal: 10,
    chatsPerDay: 10,
    widgetChatsPerDay: 30,
    widgetToolsPerDay: 5,
    nudgesEnabled: false,
  },
  pro: {
    knowledgeDocs: 25,
    chatHistoryTotal: 20,
    chatsPerDay: 30,
    widgetChatsPerDay: 60,
    widgetToolsPerDay: 25,
    nudgesEnabled: true,
  },
  premium: {
    knowledgeDocs: 50,
    chatHistoryTotal: 50,
    chatsPerDay: 100,
    widgetChatsPerDay: 120,
    widgetToolsPerDay: 50,
    nudgesEnabled: true,
  },
};

/**
 * Returns the plan limits for the given tier string.
 * Falls back to `free` if the tier is unrecognised.
 */
export function getPlanLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[(tier as Tier) in PLAN_LIMITS ? (tier as Tier) : "free"];
}
