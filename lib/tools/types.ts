/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { LLMTool } from "@/types/llm";
import type { Tier } from "@/types/billing";

/**
 * A TOOL_REGISTRY entry — same shape as LLMTool but carries minTier and group metadata.
 * Strip minTier + group before passing to the LLM (use getToolsForTier).
 */
export type ToolRegistryEntry = LLMTool & { minTier: Tier; group: string };

export type ActionResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * A ToolHandler receives the resolved userId and the parsed (but unvalidated)
 * args object from the LLM, and returns an ActionResult.
 * Each feature owns a map of tool name → ToolHandler in its handler file.
 */
export type ToolHandler = (
  userId: string,
  args: Record<string, unknown>,
) => Promise<ActionResult>;
