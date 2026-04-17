/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const knowledgeTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "knowledge",
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Search the user's personal knowledge base using semantic similarity. Use this when the user asks about something they may have uploaded, references a document, or asks a question that could be answered by their stored knowledge. Returns the most relevant text excerpts along with the source document name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The natural-language question or topic to search for. Be specific — better queries yield better results.",
          },
          topK: {
            type: "number",
            description:
              "Maximum number of results to return (1-10). Defaults to 5. Use a lower value for focused lookups, higher for broad research.",
          },
        },
        required: ["query"],
      },
    },
  },
];
