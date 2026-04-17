/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const briefingTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "briefings",
    type: "function",
    function: {
      name: "get_briefing",
      description:
        "Retrieve the user's current daily executive briefing. Use this when the user asks to see their briefing, morning summary, or daily overview.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "briefings",
    type: "function",
    function: {
      name: "regenerate_briefing",
      description:
        "Generate a fresh daily executive briefing for the user based on their current tasks, upcoming meetings, and open decisions. Use this when the user asks to regenerate, refresh, or create a new briefing. Do not use this if the user only wants to read the existing briefing — use get_briefing instead.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
