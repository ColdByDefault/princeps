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

export const webResearchTools: ToolRegistryEntry[] = [
  {
    minTier: "pro",
    group: "web-research",
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information, news, facts, or research. Use this when the user asks about something that may require up-to-date information not present in their personal workspace. Returns a list of summarized results with source URLs. Always cite the URLs in your response.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A concise, specific search query. Do not include personal names, email addresses, or other personal identifiers — focus on the topic only.",
          },
          maxResults: {
            type: "number",
            description:
              "Maximum number of results to return (1-10). Defaults to 5.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    minTier: "pro",
    group: "web-research",
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Fetch and extract the main text content from a specific public web page. Use this when the user shares a URL and wants you to read and summarize it, or when a web_search result needs deeper analysis. Only works with public HTTPS URLs.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The full public HTTPS URL of the page to fetch (e.g. https://example.com/article). Must start with https://.",
          },
        },
        required: ["url"],
      },
    },
  },
];
