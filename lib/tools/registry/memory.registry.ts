/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const memoryTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "memory",
    type: "function",
    function: {
      name: "remember_fact",
      description:
        "Store a fact about the user in long-term memory. Use this when the user shares information they want remembered (e.g. preferences, personal details, goals). Always confirm the stored key and value in your reply.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description:
              'Brief topic label for the fact (e.g. "job title", "preferred language", "dietary preference"). Max 100 characters.',
          },
          value: {
            type: "string",
            description: "The fact content to remember. Max 2000 characters.",
          },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    minTier: "free",
    group: "memory",
    type: "function",
    function: {
      name: "recall_facts",
      description:
        "Retrieve all facts stored in the user's long-term memory. Use this when you need context about the user that is not in the current conversation.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "memory",
    type: "function",
    function: {
      name: "forget_fact",
      description:
        "Delete a specific fact from the user's long-term memory by its ID. Use recall_facts first to find the correct entry ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the memory entry to delete.",
          },
        },
        required: ["id"],
      },
    },
  },
];
