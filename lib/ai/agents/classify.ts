/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Lightweight orchestrator routing helper.
 * Maps a user message to zero or more sub-agent names from AGENT_REGISTRY.
 * Uses a cheap, non-streaming LLM call with no tools and a strict JSON output contract.
 */

import "server-only";

import { callChat } from "@/lib/ai/llm-providers/provider";
import { AGENT_REGISTRY } from "@/lib/ai/agents/registry";
import type { Tier } from "@/types/billing";

/** Evaluation order — lower index = lower tier. */
const TIER_ORDER: Tier[] = ["free", "pro", "premium", "enterprise"];

// ─── Prompt ───────────────────────────────────────────────

function buildClassifyPrompt(userTier?: Tier): string {
  const tierIdx = userTier ? TIER_ORDER.indexOf(userTier) : TIER_ORDER.length;
  const agentList = Object.values(AGENT_REGISTRY)
    .filter((a) => {
      const minIdx = TIER_ORDER.indexOf(a.minTier);
      return tierIdx === -1 || minIdx <= tierIdx;
    })
    .map((a) => `- "${a.name}": ${a.description}`)
    .join("\n");

  return `You are a routing classifier for an executive assistant system.
Your only job is to decide which specialised sub-agents (if any) should handle a user message before the main assistant responds.

Available agents:
${agentList}

Rules:
- Return ONLY a valid JSON array of agent names (e.g. ["task-extractor"]).
- Return [] if no agent is appropriate.
- You may return multiple agents if the message clearly calls for more than one.
- Do not wrap your response in markdown code blocks or add any explanation — raw JSON only.
- When in doubt, return []. The main assistant handles everything else.`;
}

// ─── Classifier ───────────────────────────────────────────

/**
 * Classifies a user message and returns the names of sub-agents that should
 * handle it before the main assistant responds.
 *
 * Returns an empty array when:
 *  - No agent is appropriate.
 *  - The LLM call fails.
 *  - The response cannot be parsed.
 *  - No agents are available for the user's tier.
 *
 * Never throws — failures are silent and safe (orchestrator falls through to normal chat).
 */
export async function classifyMessage(
  message: string,
  userTier?: Tier,
): Promise<string[]> {
  let raw: string;

  try {
    const result = await callChat(
      [
        { role: "system", content: buildClassifyPrompt(userTier) },
        { role: "user", content: message },
      ],
      {
        temperature: 0,
        contextLength: 256,
      },
    );
    raw = result.content?.trim() ?? "";
  } catch {
    // Silent failure — orchestrator continues without delegation
    return [];
  }

  if (!raw) return [];

  // Strip accidental markdown fences if the model adds them despite instructions
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  // Filter to only valid, registered agent names — prevents hallucinated names
  const validNames = new Set(Object.keys(AGENT_REGISTRY));
  return parsed.filter(
    (item): item is string => typeof item === "string" && validNames.has(item),
  );
}
