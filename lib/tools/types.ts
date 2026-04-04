/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

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
