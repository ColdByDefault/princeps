/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Signal-feed sub-agent definition.
 * Searches the web for recent signals on a given topic, cross-references
 * the user's knowledge base, scores results by relevance, and produces
 * a structured intelligence digest with cited source URLs.
 * Persists the digest to the knowledge base via create_knowledge when content
 * is substantive enough to be worth storing for later retrieval.
 */

import "server-only";

import type { AgentDefinition } from "@/lib/ai/agents/types";

export const signalFeedAgent: AgentDefinition = {
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
5. Call create_knowledge to persist the digest with a descriptive name (e.g. "Signal Digest — [Topic] [Date]").

Keep the digest concise. Always cite source URLs. Do not fabricate sources.`,
  tools: ["web_search", "fetch_url", "search_knowledge", "create_knowledge"],
  minTier: "pro",
  maxRounds: 4,
};
