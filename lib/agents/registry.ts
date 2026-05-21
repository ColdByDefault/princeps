/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Agent registry for the Princeps sub-agents system.
 * Maps stable agent names to their AgentDefinition and exposes the public
 * runAgent(name, input) entry point used by the orchestrator, cron, and webhooks.
 */

import "server-only";

import { runAgentWithDefinition } from "./runner";
import type { AgentDefinition, AgentInput, AgentOutput } from "./types";
import { taskExtractorAgent } from "./agents/task-extractor.agent";

// ─── Phase 1 Agent Definitions (inline — move to agents/*.agent.ts as implemented) ──

/**
 * Extracts decisions from meeting notes or free text and logs them.
 * Captures title, rationale, and outcome where stated.
 */
const decisionLoggerAgent: AgentDefinition = {
  name: "decision-logger",
  description:
    "Extract and log decisions from meeting notes, recap text, or any free-form input that describes choices that were made. Use when the user provides text that contains decisions.",
  systemPrompt: `You are a decision-logging specialist. Your only job is to read the user's text, identify every decision that was made or recorded, and call create_decision for each one.

Rules:
- Create one decision per distinct choice. Do not merge unrelated decisions.
- Extract rationale and outcome only if they are explicitly stated — do not infer.
- Set status to "decided" if the text confirms the decision was made; "open" if it is still pending.
- Do not invent decisions — only extract what is stated.
- After all decisions are created, respond with a brief plain-text summary of what was logged.`,
  tools: ["create_decision", "list_decisions"],
  minTier: "free",
  maxRounds: 3,
};

/**
 * Runs a structured weekly review: summarises open tasks, upcoming meetings,
 * and active goals. Returns a concise executive briefing-style digest.
 */
const weeklyReviewAgent: AgentDefinition = {
  name: "weekly-review",
  description:
    "Run a structured weekly review by gathering open tasks, upcoming meetings, and active goals, then producing a concise summary. Use when the user asks to run their weekly review or wants a digest of their current commitments.",
  systemPrompt: `You are a weekly-review assistant. Produce a concise executive digest for the user.

Steps:
1. Call list_tasks to fetch open and in-progress tasks. Note overdue ones.
2. Call list_meetings to fetch upcoming meetings for the next 7 days.
3. Call list_goals to fetch active goals and their progress.
4. Synthesise the results into a structured weekly review with these sections:
   - **Tasks to action** — overdue and high-priority items
   - **Upcoming meetings** — next 7 days
   - **Goals check-in** — progress and next milestones
   - **Suggested focus** — one or two key priorities for the week

Keep the output tight and executive-level. No bullet lists longer than 5 items.`,
  tools: ["list_tasks", "list_meetings", "list_goals"],
  minTier: "pro",
  maxRounds: 4,
};

/**
 * Fetches web signals on a topic, scores them, and surfaces a digest.
 * Optionally cross-references the user's knowledge base.
 * Note: full write-to-knowledge (create_knowledge tool) is planned for a future iteration.
 */
const signalFeedAgent: AgentDefinition = {
  name: "signal-feed",
  description:
    "Search the web for recent signals, news, or developments on a given topic, then produce a scored digest. Use when the user asks what is happening in a particular domain or wants an intelligence feed.",
  systemPrompt: `You are an intelligence analyst. Your job is to find recent, relevant signals on the topic the user specifies and synthesise them into a scored digest.

Steps:
1. Run 2–3 targeted web_search calls to gather signals on the topic.
2. Optionally call search_knowledge to check if the user has relevant existing documents.
3. Score each signal: High / Medium / Low relevance based on recency and strategic importance.
4. Produce a structured digest:
   - **Top signals** — highest relevance items with source URLs
   - **Notable developments** — medium relevance
   - **What to watch** — emerging or low-signal items worth monitoring

Keep the digest concise. Always cite source URLs. Do not fabricate sources.`,
  tools: ["web_search", "fetch_url", "search_knowledge"],
  minTier: "pro",
  maxRounds: 4,
};

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
): Promise<AgentOutput> {
  const definition = getAgentDefinition(agentName);

  if (!definition) {
    return {
      ok: false,
      summary: "",
      error: `Unknown agent: "${agentName}". Check AGENT_REGISTRY in lib/agents/registry.ts.`,
    };
  }

  return runAgentWithDefinition(definition, input);
}
