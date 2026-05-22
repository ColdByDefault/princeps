/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { taskHandlers } from "@/lib/ai/tools/handlers/tasks.handler";
import { labelHandlers } from "@/lib/ai/tools/handlers/labels.handler";
import { profileHandlers } from "@/lib/ai/tools/handlers/profile.handler";
import { contactHandlers } from "@/lib/ai/tools/handlers/contacts.handler";
import { meetingHandlers } from "@/lib/ai/tools/handlers/meetings.handler";
import { decisionHandlers } from "@/lib/ai/tools/handlers/decisions.handler";
import { goalHandlers } from "@/lib/ai/tools/handlers/goals.handler";
import { knowledgeHandlers } from "@/lib/ai/tools/handlers/knowledge.handler";
import { memoryHandlers } from "@/lib/ai/tools/handlers/memory.handler";
import { briefingHandlers } from "@/lib/ai/tools/handlers/briefings.handler";
import { webResearchHandlers } from "@/lib/ai/tools/handlers/web-research.handler";
import { driveHandlers } from "@/lib/ai/tools/handlers/drive.handler";
import { getActiveToolsForUser } from "@/lib/ai/tools/registry";
import type { LLMToolCall } from "@/types/llm";
import type { ActionResult } from "@/lib/ai/tools/types";

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
  ...goalHandlers,
  ...knowledgeHandlers,
  ...memoryHandlers,
  ...briefingHandlers,
  ...webResearchHandlers,
  ...driveHandlers,
};

/**
 * Dispatches a single LLM tool call to the appropriate feature handler.
 * Any surface (chat, cron, webhook, agents) can call this.
 */
export async function executeToolCall(
  userId: string,
  toolCall: LLMToolCall,
): Promise<ActionResult> {
  const toolName = toolCall.function.name;
  let args: Record<string, unknown>;

  try {
    args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Invalid tool arguments: not valid JSON." };
  }

  const handler = HANDLERS[toolName];
  if (!handler) {
    return { ok: false, error: `Unknown tool: ${toolName}` };
  }

  const activeTools = await getActiveToolsForUser(userId);
  const isAllowed = activeTools.some((tool) => tool.function.name === toolName);
  if (!isAllowed) {
    return {
      ok: false,
      error: `Tool not available for this user's plan or settings: ${toolName}`,
    };
  }

  try {
    return await handler(userId, args);
  } catch (err) {
    console.error(`[tools/${toolName}] Handler failed:`, err);
    return {
      ok: false,
      error: `${toolName} failed before it could complete. Verify any referenced record IDs and try again.`,
    };
  }
}
