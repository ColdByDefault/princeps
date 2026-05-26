/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.11
 * @since canary-v1.1.11
 * @description Handlers for the sub-agent tools defined in
 * registry/agents.registry.ts.
 *
 * Each handler builds the AgentInput from the LLM-supplied arguments and
 * delegates to runAgent(). The agent's internal tool calls flow through
 * executeToolCall like any other tool, so tracking is uniform.
 *
 * The returned data shape includes both:
 *   - `summary`: the agent's concise output (the only thing the LLM needs to
 *     reason about its next step).
 *   - `agentCalls`: the raw inner tool-call records so the calling surface
 *     (chat / widget / cron) can seed report rows with agent provenance.
 */

import "server-only";

import { runAgent } from "@/lib/ai/agents/registry";
import type { AgentActionCall } from "@/lib/ai/agents/types";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

/**
 * Shape returned in ActionResult.data for every agent tool.
 * The outer route inspects `agentCalls` to flatten provenance into report rows.
 */
export type AgentToolData = {
  agent: string;
  summary: string;
  agentCalls: AgentActionCall[];
};

function getStringArg(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

async function runAgentAsTool(
  agentName: string,
  userId: string,
  userMessage: string,
): Promise<ActionResult> {
  const result = await runAgent(agentName, { userId, userMessage });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error ?? `${agentName} did not complete successfully.`,
    };
  }

  const data: AgentToolData = {
    agent: agentName,
    summary: result.summary,
    agentCalls: result.agentCalls ?? [],
  };
  return { ok: true, data };
}

// ─── Per-agent argument shaping ───────────────────────────

async function handleRunWeeklyReview(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const focus = getStringArg(args, "focus");
  const userMessage = focus
    ? `Run my weekly review, with extra focus on: ${focus}`
    : "Run my weekly review.";
  return runAgentAsTool("weekly-review", userId, userMessage);
}

async function handleRunTaskExtractor(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const text = getStringArg(args, "text");
  if (!text) {
    return {
      ok: false,
      error:
        "run_task_extractor requires a `text` argument containing the content to extract action items from.",
    };
  }
  return runAgentAsTool("task-extractor", userId, text);
}

async function handleRunDecisionLogger(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const text = getStringArg(args, "text");
  if (!text) {
    return {
      ok: false,
      error:
        "run_decision_logger requires a `text` argument containing the content to extract decisions from.",
    };
  }
  return runAgentAsTool("decision-logger", userId, text);
}

async function handleRunSignalFeed(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const topic = getStringArg(args, "topic");
  if (!topic) {
    return {
      ok: false,
      error:
        "run_signal_feed requires a `topic` argument describing what to scan for.",
    };
  }
  return runAgentAsTool(
    "signal-feed",
    userId,
    `Produce a signal-feed digest on: ${topic}`,
  );
}

async function handleRunCommitmentTracker(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const text = getStringArg(args, "text");
  if (!text) {
    return {
      ok: false,
      error:
        "run_commitment_tracker requires a `text` argument containing the meeting notes or conversation text to scan.",
    };
  }
  return runAgentAsTool("commitment-tracker", userId, text);
}

export const agentHandlers: Record<string, ToolHandler> = {
  run_weekly_review: handleRunWeeklyReview,
  run_task_extractor: handleRunTaskExtractor,
  run_decision_logger: handleRunDecisionLogger,
  run_signal_feed: handleRunSignalFeed,
  run_commitment_tracker: handleRunCommitmentTracker,
};
