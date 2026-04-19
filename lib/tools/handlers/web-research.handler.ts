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

import { searchWeb, fetchUrl } from "@/lib/web-research/search.logic";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleWebSearch(
  _userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const query = typeof args.query === "string" ? args.query.trim() : null;
  if (!query) {
    return { ok: false, error: "web_search requires a non-empty query." };
  }

  const maxResults =
    typeof args.maxResults === "number" && args.maxResults > 0
      ? args.maxResults
      : 5;

  try {
    const response = await searchWeb(query, maxResults);

    if (response.results.length === 0) {
      return {
        ok: true,
        data: {
          results: [],
          message: "No web results found for this query.",
        },
      };
    }

    return {
      ok: true,
      data: {
        query: response.query,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          ...(r.publishedDate ? { publishedDate: r.publishedDate } : {}),
        })),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Web search failed.",
    };
  }
}

async function handleFetchUrl(
  _userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const url = typeof args.url === "string" ? args.url.trim() : null;
  if (!url) {
    return { ok: false, error: "fetch_url requires a non-empty url." };
  }

  try {
    const result = await fetchUrl(url);
    return {
      ok: true,
      data: {
        url: result.url,
        title: result.title,
        content: result.content,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "URL fetch failed.",
    };
  }
}

export const webResearchHandlers: Record<string, ToolHandler> = {
  web_search: handleWebSearch,
  fetch_url: handleFetchUrl,
};
