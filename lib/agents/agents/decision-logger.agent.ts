/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Decision-logger sub-agent definition.
 * Extracts decisions from meeting notes, recap text, or any free-form input
 * and logs each one via create_decision. Captures title, rationale, and outcome
 * only where explicitly stated — never infers.
 */

import "server-only";

import type { AgentDefinition } from "@/lib/agents/types";

export const decisionLoggerAgent: AgentDefinition = {
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
