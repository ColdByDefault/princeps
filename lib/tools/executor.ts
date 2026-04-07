/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { taskHandlers } from "@/lib/tools/handlers/tasks.handler";
import { labelHandlers } from "@/lib/tools/handlers/labels.handler";
import { profileHandlers } from "@/lib/tools/handlers/profile.handler";
import { contactHandlers } from "@/lib/tools/handlers/contacts.handler";
import { meetingHandlers } from "@/lib/tools/handlers/meetings.handler";
import { decisionHandlers } from "@/lib/tools/handlers/decisions.handler";
import type { LLMToolCall } from "@/types/llm";
import type { ActionResult } from "@/lib/tools/types";

export type { ActionResult };

/**
 * Handler map: tool name → handler function.
 * To add a new feature, create a new handler file and spread it here.
 * executor.ts itself never needs to change.
 */
const HANDLERS: Record<
  string,
  (userId: string, args: Record<string, unknown>) => Promise<ActionResult>
> = {
  ...taskHandlers,
  ...labelHandlers,
  ...profileHandlers,
  ...contactHandlers,
  ...meetingHandlers,
  ...decisionHandlers,
};

/**
 * Dispatches a single LLM tool call to the appropriate feature handler.
 * Any surface (chat, cron, webhook, agents) can call this.
 */
export async function executeToolCall(
  userId: string,
  toolCall: LLMToolCall,
): Promise<ActionResult> {
  let args: Record<string, unknown>;

  try {
    args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Invalid tool arguments: not valid JSON." };
  }

  const handler = HANDLERS[toolCall.function.name];
  if (!handler) {
    return { ok: false, error: `Unknown tool: ${toolCall.function.name}` };
  }

  return handler(userId, args);
}
