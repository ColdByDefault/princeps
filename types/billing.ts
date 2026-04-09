/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export type Tier = "free" | "pro" | "premium" | "enterprise";

export interface PlanLimits {
  /** Max total knowledge documents stored at once (no monthly reset). */
  knowledgeDocs: number;
  /**
   * Max single file size in bytes (enforced before parsing).
   * Prevents huge files from consuming the lifetime chars budget in one shot.
   */
  knowledgeFileSizeBytes: number;
  /**
   * Max cumulative characters ever processed by the knowledge pipeline.
   * This counter NEVER decrements when documents are deleted —
   * it is the primary anti-bypass gate (delete → re-upload stays counted).
   */
  knowledgeLifetimeChars: number;
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
  /**
   * Max total contacts stored at once (no monthly reset).
   * `-1` = unlimited — the enforce function skips the count check.
   */
  contactsMax: number;
  /**
   * Max total tasks stored at once (no monthly reset).
   * `-1` = unlimited — the enforce function skips the count check.
   */
  tasksMax: number;
  /**
   * Max total meetings stored at once (no monthly reset).
   * `-1` = unlimited — the enforce function skips the count check.
   */
  meetingsMax: number;
  /**
   * Max total decisions stored at once (no monthly reset).
   * `-1` = unlimited — the enforce function skips the count check.
   */
  decisionsMax: number;
  /**
   * Max total goals stored at once (no monthly reset).
   * `-1` = unlimited — the enforce function skips the count check.
   */
  goalsMax: number;
  /**
   * Max total memory entries stored at once (no monthly reset).
   * `-1` = unlimited — the enforce function skips the count check.
   */
  memoryMax: number;
  /** Whether proactive nudge notifications are active. */
  nudgesEnabled: boolean;
  /**
   * Max AI-generated prep packs per calendar month.
   * `0` = feature disabled for this tier.
   */
  prepPacksPerMonth: number;
  /**
   * Max daily briefings manually regenerated per calendar day.
   * Spam burst guard only — the monthly limit is the primary gate.
   */
  briefingsPerDay: number;
  /**
   * Max daily briefings manually regenerated per calendar month.
   * `-1` = unlimited. `0` = feature disabled for this tier.
   */
  briefingsPerMonth: number;
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
    knowledgeFileSizeBytes: 500_000, // 500 KB
    knowledgeLifetimeChars: 75_000, // ~18 750 tokens
    chatHistoryTotal: 10,
    chatsPerDay: 3,
    messagesPerMonth: 75,
    tokensPerMonth: 125_000,
    widgetChatsPerDay: 30,
    widgetToolsPerDay: 5,
    toolCallsPerMonth: 50,
    contactsMax: 10,
    tasksMax: 20,
    meetingsMax: 10,
    decisionsMax: 10,
    goalsMax: 10,
    memoryMax: 25,
    nudgesEnabled: false,
    prepPacksPerMonth: 0,
    briefingsPerDay: 1,
    briefingsPerMonth: 3,
  },
  pro: {
    knowledgeDocs: 25,
    knowledgeFileSizeBytes: 2_000_000, // 2 MB
    knowledgeLifetimeChars: 500_000, // ~125 000 tokens
    chatHistoryTotal: 25,
    chatsPerDay: 5,
    messagesPerMonth: 250,
    tokensPerMonth: 400_000,
    widgetChatsPerDay: 60,
    widgetToolsPerDay: 25,
    toolCallsPerMonth: 200,
    contactsMax: 25,
    tasksMax: 100,
    meetingsMax: 50,
    decisionsMax: 50,
    goalsMax: 25,
    memoryMax: 100,
    nudgesEnabled: true,
    prepPacksPerMonth: 10,
    briefingsPerDay: 3,
    briefingsPerMonth: 30,
  },
  premium: {
    knowledgeDocs: 50,
    knowledgeFileSizeBytes: 5_000_000, // 5 MB
    knowledgeLifetimeChars: 2_000_000, // ~500 000 tokens
    chatHistoryTotal: 50,
    chatsPerDay: 10,
    messagesPerMonth: 650,
    tokensPerMonth: 1_000_000,
    widgetChatsPerDay: 120,
    widgetToolsPerDay: 50,
    toolCallsPerMonth: 500,
    contactsMax: 50,
    tasksMax: 500,
    meetingsMax: 200,
    decisionsMax: 200,
    goalsMax: 100,
    memoryMax: 500,
    nudgesEnabled: true,
    prepPacksPerMonth: 25,
    briefingsPerDay: 5,
    briefingsPerMonth: 100,
  },
  enterprise: {
    knowledgeDocs: 200,
    knowledgeFileSizeBytes: 20_000_000, // 20 MB
    knowledgeLifetimeChars: 10_000_000, // ~2 500 000 tokens
    chatHistoryTotal: 200,
    chatsPerDay: 20,
    messagesPerMonth: 2_000,
    tokensPerMonth: 3_000_000,
    widgetChatsPerDay: 300,
    widgetToolsPerDay: 100,
    toolCallsPerMonth: 2_000,
    contactsMax: -1,
    tasksMax: -1,
    meetingsMax: -1,
    decisionsMax: -1,
    goalsMax: -1,
    memoryMax: -1,
    nudgesEnabled: true,
    prepPacksPerMonth: 100,
    briefingsPerDay: -1,
    briefingsPerMonth: -1,
  },
};

/**
 * Returns the plan limits for the given tier.
 * Falls back to `free` as a runtime safety net.
 */
export function getPlanLimits(tier: Tier): PlanLimits {
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;
}

// ─── Plan prices ──────────────────────────────────────────

export interface PlanPrice {
  /** Monthly price in EUR. 0 = free tier. */
  monthly: number;
  /** Annual price in EUR. null = no annual option. */
  annual: number | null;
}

export const PLAN_PRICES: Record<Tier, PlanPrice> = {
  free: { monthly: 0, annual: null },
  pro: { monthly: 9, annual: 89 },
  premium: { monthly: 19, annual: 179 },
  enterprise: { monthly: 49, annual: 449 },
};

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
  /** Current count of knowledge documents at rest. */
  knowledgeDocsStored: number;
  /** Plan maximum for knowledge documents at rest. */
  knowledgeDocsLimit: number;
  /** Lifetime characters ever processed by the knowledge pipeline (never decrements). */
  knowledgeCharsUsed: number;
  /** Plan maximum for lifetime knowledge characters. */
  knowledgeCharsLimit: number;
  /** Current count of contacts at rest. */
  contactsStored: number;
  /** Plan maximum for contacts at rest. */
  contactsLimit: number;
  /** Current count of tasks at rest. */
  tasksStored: number;
  /** Plan maximum for tasks at rest. `-1` = unlimited. */
  tasksLimit: number;
  /** Current count of meetings at rest. */
  meetingsStored: number;
  /** Plan maximum for meetings at rest. `-1` = unlimited. */
  meetingsLimit: number;
  /** Current count of decisions at rest. */
  decisionsStored: number;
  /** Plan maximum for decisions at rest. `-1` = unlimited. */
  decisionsLimit: number;
  /** Current count of goals at rest. */
  goalsStored: number;
  /** Plan maximum for goals at rest. `-1` = unlimited. */
  goalsLimit: number;
  /** Current count of memory entries at rest. */
  memoryStored: number;
  /** Plan maximum for memory entries at rest. `-1` = unlimited. */
  memoryLimit: number;
  /** Number of AI-generated prep packs this month. */
  prepPacksGenerated: number;
  /** Plan maximum for AI-generated prep packs per month. `0` = feature disabled. */
  prepPacksLimit: number;
  /** Number of daily briefings manually regenerated this month. */
  briefingsGenerated: number;
  /** Plan maximum for briefings regenerated per month. `-1` = unlimited. */
  briefingsLimit: number;
  /** "YYYY-MM" string of the current billing month, or null if never tracked. */
  monthlyResetDate: string | null;
}
