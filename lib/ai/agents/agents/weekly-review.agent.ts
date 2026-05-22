/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since canary-v1.1.3
 * @module
 * @description Weekly-review sub-agent definition.
 * Gathers open tasks, upcoming meetings, and active goals, then synthesises
 * a concise executive digest. Triggered by "run my weekly review" or similar.
 */

import "server-only";

import type { AgentDefinition } from "@/lib/ai/agents/types";

export const weeklyReviewAgent: AgentDefinition = {
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
