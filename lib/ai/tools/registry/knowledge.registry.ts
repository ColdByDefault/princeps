/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since beta
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
  {
    minTier: "free",
    group: "knowledge",
    type: "function",
    function: {
      name: "create_knowledge",
      description:
        "Save a text document to the user's personal knowledge base. Use when the user asks to save, store, or remember a document, note, or digest — or when you have produced a substantive output (e.g. a signal digest or research summary) that the user would benefit from having stored for later retrieval. Subject to the user's knowledge document and character quota.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "A short, descriptive title for the document (e.g. 'Signal Digest — AI 2026-05-22'). Max 255 characters.",
          },
          content: {
            type: "string",
            description:
              "The full text content to store. Plain text only. Do not include raw HTML or binary data.",
          },
        },
        required: ["name", "content"],
      },
    },
  },
];
