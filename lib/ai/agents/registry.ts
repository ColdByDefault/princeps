/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.3
 * @description Agent registry for the Princeps sub-agents system.
 * Maps stable agent names to their AgentDefinition and exposes the public
 * runAgent(name, input) entry point used by the orchestrator, cron, and webhooks.
 */

import "server-only";

import { runAgentWithDefinition } from "./runner";
import type {
  AgentDefinition,
  AgentInput,
  AgentOutput,
  AgentRunOptions,
} from "./types";
import { taskExtractorAgent } from "./agents/task-extractor.agent";
import { decisionLoggerAgent } from "./agents/decision-logger.agent";
import { weeklyReviewAgent } from "./agents/weekly-review.agent";
import { signalFeedAgent } from "./agents/signal-feed.agent";
import { commitmentTrackerAgent } from "./agents/commitment-tracker.agent";

// ─── Registry ─────────────────────────────────────────────

/**
 * Master map of all registered sub-agents.
 * To add a new agent: define an AgentDefinition and add it here.
 */
export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  [taskExtractorAgent.name]: taskExtractorAgent,
  [decisionLoggerAgent.name]: decisionLoggerAgent,
  [weeklyReviewAgent.name]: weeklyReviewAgent,
  [signalFeedAgent.name]: signalFeedAgent,
  [commitmentTrackerAgent.name]: commitmentTrackerAgent,
};

// ─── Public API ───────────────────────────────────────────

/**
 * Returns the AgentDefinition for a given agent name, or undefined if not found.
 */
export function getAgentDefinition(name: string): AgentDefinition | undefined {
  return AGENT_REGISTRY[name];
}

/**
 * Public entry point for all agent invocations.
 * Looks up the definition by name and delegates to runAgentWithDefinition.
 */
export async function runAgent(
  agentName: string,
  input: AgentInput,
  options?: AgentRunOptions,
): Promise<AgentOutput> {
  const definition = getAgentDefinition(agentName);

  if (!definition) {
    return {
      ok: false,
      summary: "",
      error: `Unknown agent: "${agentName}". Check AGENT_REGISTRY in lib/agents/registry.ts.`,
    };
  }

  return runAgentWithDefinition(definition, input, options);
}
