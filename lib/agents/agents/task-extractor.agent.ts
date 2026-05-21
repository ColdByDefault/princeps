/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Task-extractor sub-agent definition.
 * Identifies action items in unstructured text and creates a task for each one.
 * Triggered by voice-memo transcripts, pasted notes, emails, or any free-form input
 * that contains things to do.
 */

import "server-only";

import type { AgentDefinition } from "@/lib/agents/types";

export const taskExtractorAgent: AgentDefinition = {
  name: "task-extractor",
  description:
    "Extract action items from unstructured text (voice memos, notes, emails) and create tasks for each one. Use when the user provides a block of text that contains things to do.",
  systemPrompt: `You are a task-extraction specialist. Your only job is to read the user's text, identify every concrete action item, and call create_task for each one.

Rules:
- Create one task per distinct action item. Do not merge unrelated actions.
- Keep titles short and imperative (e.g. "Send Q2 report to Alice").
- Set priority to "high" only if the text explicitly signals urgency.
- Do not invent tasks — only extract what is stated.
- After all tasks are created, respond with a brief plain-text summary of what was extracted.`,
  tools: ["create_task", "list_tasks"],
  minTier: "free",
  maxRounds: 3,
};
