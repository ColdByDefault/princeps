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

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
};

export type WebSearchResponse = {
  results: WebSearchResult[];
  query: string;
};

export type FetchUrlResponse = {
  url: string;
  title: string;
  content: string;
};

const TAVILY_BASE = "https://api.tavily.com";

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY is not set.");
  return key;
}

/**
 * Searches the web using Tavily and returns summarized results with citations.
 * @param query - Natural-language search query (LLM-generated, PII must be stripped before calling)
 * @param maxResults - Number of results to return (1-10, default 5)
 */
export async function searchWeb(
  query: string,
  maxResults = 5,
): Promise<WebSearchResponse> {
  const apiKey = getApiKey();
  const clampedMax = Math.min(Math.max(maxResults, 1), 10);

  const res = await fetch(`${TAVILY_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: clampedMax,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    results: Array<{
      title: string;
      url: string;
      content: string;
      published_date?: string;
    }>;
  };

  return {
    query,
    results: data.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      ...(r.published_date ? { publishedDate: r.published_date } : {}),
    })),
  };
}

/**
 * Fetches and extracts the main textual content from a public URL via Tavily.
 * Only works on publicly accessible pages — never passes internal or local URLs.
 * @param url - A fully qualified public URL (https only)
 */
export async function fetchUrl(url: string): Promise<FetchUrlResponse> {
  const apiKey = getApiKey();

  // Safety: only allow https public URLs
  if (!url.startsWith("https://")) {
    throw new Error("fetch_url only supports public HTTPS URLs.");
  }

  const res = await fetch(`${TAVILY_BASE}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ urls: [url] }),
  });

  if (!res.ok) {
    throw new Error(`Tavily extract failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    results: Array<{ url: string; raw_content: string; title?: string }>;
  };

  const first = data.results[0];
  if (!first) {
    throw new Error("Tavily returned no content for this URL.");
  }

  return {
    url: first.url,
    title: first.title ?? "",
    content: first.raw_content,
  };
}
