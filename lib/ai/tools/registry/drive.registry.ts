/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const driveTools: ToolRegistryEntry[] = [
  {
    minTier: "pro",
    group: "integrations",
    type: "function",
    function: {
      name: "search_drive",
      description:
        "Search documents indexed from the user's Google Drive using semantic similarity. Use this when the user asks about content from their Drive files, references a specific document, or when Drive context would enrich the answer. Returns the most relevant text excerpts along with the source file name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The natural-language question or topic to search for across Drive documents.",
          },
          topK: {
            type: "number",
            description:
              "Maximum number of results to return (1-10). Defaults to 5.",
          },
        },
        required: ["query"],
      },
    },
  },
];
