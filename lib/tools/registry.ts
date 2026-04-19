/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { db } from "@/lib/db";
import type { LLMTool } from "@/types/llm";
import type { Tier } from "@/types/billing";
import type { ToolRegistryEntry } from "./types";
import { taskTools } from "./registry/tasks.registry";
import { labelTools } from "./registry/labels.registry";
import { profileTools } from "./registry/profile.registry";
import { contactTools } from "./registry/contacts.registry";
import { meetingTools } from "./registry/meetings.registry";
import { decisionTools } from "./registry/decisions.registry";
import { goalTools } from "./registry/goals.registry";
import { knowledgeTools } from "./registry/knowledge.registry";
import { memoryTools } from "./registry/memory.registry";
import { briefingTools } from "./registry/briefings.registry";
import { webResearchTools } from "./registry/web-research.registry";

export type { ToolRegistryEntry };

/** Tier evaluation order — lower index = lower tier. */
const TIER_ORDER: Tier[] = ["free", "pro", "premium", "enterprise"];

/**
 * Returns the tools the LLM is allowed to call for the given tier,
 * minus any the user has individually disabled.
 * The returned array is OpenAI-compatible (minTier is stripped).
 */
export function getToolsForTier(
  tier: Tier,
  disabledToolNames: string[] = [],
): LLMTool[] {
  const userIdx = TIER_ORDER.indexOf(tier);
  return TOOL_REGISTRY.filter(
    ({ minTier, function: fn }) =>
      TIER_ORDER.indexOf(minTier) <= userIdx &&
      !disabledToolNames.includes(fn.name),
  ).map(({ minTier: _m, group: _g, ...tool }) => tool as LLMTool);
}

/**
 * Fetches the user's tier + disabled tool preferences from the DB,
 * then returns the filtered LLMTool list ready to pass to the LLM.
 */
export async function getActiveToolsForUser(
  userId: string,
): Promise<LLMTool[]> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true, preferences: true },
  });

  const tier = user.tier as Tier;
  let disabledTools: string[] = [];

  const prefs = user.preferences;
  if (typeof prefs === "object" && prefs !== null && !Array.isArray(prefs)) {
    const prefsObj = prefs as Record<string, unknown>;
    if (Array.isArray(prefsObj.disabledTools)) {
      disabledTools = (prefsObj.disabledTools as unknown[]).filter(
        (t): t is string => typeof t === "string",
      );
    }
  }

  return getToolsForTier(tier, disabledTools);
}

/**
 * All tools the LLM can call, in OpenAI function-calling schema format.
 * To add a new tool: add a <feature>.registry.ts in ./registry/ and spread it below.
 */
export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  ...taskTools,
  ...labelTools,
  ...profileTools,
  ...contactTools,
  ...meetingTools,
  ...decisionTools,
  ...goalTools,
  ...knowledgeTools,
  ...memoryTools,
  ...briefingTools,
  ...webResearchTools,
];
