/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Core runner for the Princeps sub-agents system.
 * Executes an AgentDefinition against an AgentInput and returns an AgentOutput.
 * Any surface (chat orchestrator, cron, webhooks) can call runAgentWithDefinition directly,
 * or use the higher-level runAgent(name, input) exported from registry.ts.
 */

import "server-only";

import { db } from "@/lib/core/db";
import { streamChat } from "@/lib/ai/llm-providers/provider";
import { executeToolCall } from "@/lib/ai/tools/executor";
import { getActiveToolsForUser } from "@/lib/ai/tools/registry";
import type { LLMMessage, LLMToolCall } from "@/types/llm";
import type { Tier } from "@/types/billing";
import type { ActionResult } from "@/lib/ai/tools/types";
import type { AgentDefinition, AgentInput, AgentOutput } from "./types";

// ─── Constants ────────────────────────────────────────────

/** Evaluation order — lower index = lower tier. */
const TIER_ORDER: Tier[] = ["free", "pro", "premium", "enterprise"];

const DEFAULT_MAX_ROUNDS = 3;

// ─── Runner ───────────────────────────────────────────────

/**
 * Executes a sub-agent defined by an AgentDefinition.
 * Prefer the higher-level runAgent(name, input) in registry.ts for name-based invocation.
 *
 * Flow:
 *  1. Enforce minTier gate.
 *  2. Intersect the agent's allowed tools with the user's active tools.
 *  3. Run a tool-call loop (up to maxRounds) using streamChat.
 *  4. Return a structured AgentOutput for the orchestrator to use.
 *
 * Note: streamChat is used (not callChat) because callChat does not forward
 * the tools array to the provider API.
 */
export async function runAgentWithDefinition(
  definition: AgentDefinition,
  input: AgentInput,
): Promise<AgentOutput> {
  // ── 1. Tier gate ──────────────────────────────────────────
  let user: { tier: string };
  try {
    user = await db.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: { tier: true },
    });
  } catch {
    return { ok: false, summary: "", error: "User not found." };
  }

  const userTierIdx = TIER_ORDER.indexOf(user.tier as Tier);
  const minTierIdx = TIER_ORDER.indexOf(definition.minTier);

  if (userTierIdx < minTierIdx) {
    return {
      ok: false,
      summary: "",
      error: `Agent "${definition.name}" requires the "${definition.minTier}" plan or above.`,
    };
  }

  // ── 2. Tool filtering ─────────────────────────────────────
  const activeTools = await getActiveToolsForUser(input.userId);
  const agentTools = activeTools.filter((t) =>
    definition.tools.includes(t.function.name),
  );

  // ── 3. Initial messages ───────────────────────────────────
  const systemContent =
    definition.systemPrompt + (input.context ? `\n\n${input.context}` : "");

  const messages: LLMMessage[] = [
    { role: "system", content: systemContent },
    { role: "user", content: input.userMessage },
  ];

  const collectedActions: ActionResult[] = [];
  const maxRounds = definition.maxRounds ?? DEFAULT_MAX_ROUNDS;
  let summary = "";

  // ── 4. Tool-call loop ─────────────────────────────────────
  try {
    for (let round = 0; round < maxRounds; round++) {
      let content = "";
      const toolCalls: LLMToolCall[] = [];

      for await (const chunk of streamChat(messages, { tools: agentTools })) {
        if (typeof chunk === "string") {
          content += chunk;
        } else {
          toolCalls.push(chunk);
        }
      }

      if (toolCalls.length === 0) {
        // No tool calls — this is the final text response.
        summary = content;
        break;
      }

      // Append assistant turn (may have empty content when model goes straight to tools)
      messages.push({
        role: "assistant",
        content: content || null,
        tool_calls: toolCalls,
      });

      // Execute each tool call and append results to the conversation
      for (const toolCall of toolCalls) {
        const result = await executeToolCall(input.userId, toolCall);
        collectedActions.push(result);
        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
      }

      // Last round with outstanding tool calls — use available text or fallback
      if (round === maxRounds - 1) {
        summary =
          content.trim() ||
          `Agent completed ${collectedActions.length} action(s).`;
      }
    }
  } catch (err) {
    return {
      ok: false,
      summary: "",
      ...(collectedActions.length > 0 && { actions: collectedActions }),
      error:
        err instanceof Error ? err.message : "Unknown error in agent runner.",
    };
  }

  return {
    ok: true,
    summary,
    ...(collectedActions.length > 0 && { actions: collectedActions }),
  };
}
