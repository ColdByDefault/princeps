import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUrl, searchWeb } from "@/lib/services/web-research/search.logic";

const fetchMock = vi.fn<typeof fetch>();
const originalTavilyApiKey = process.env.TAVILY_API_KEY;

describe("web research service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    process.env.TAVILY_API_KEY = "tavily-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalTavilyApiKey === undefined) {
      delete process.env.TAVILY_API_KEY;
    } else {
      process.env.TAVILY_API_KEY = originalTavilyApiKey;
    }
  });

  it("searches Tavily with clamped max results and maps citations", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: "Market update",
              url: "https://example.com/market",
              content: "A short summary.",
              published_date: "2026-05-20",
            },
          ],
        }),
      ),
    );

    const result = await searchWeb("AI market", 50);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.tavily.com/search");
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer tavily-key",
      },
    });
    expect(JSON.parse(init?.body as string)).toMatchObject({
      query: "AI market",
      max_results: 10,
      search_depth: "basic",
    });
    expect(result).toEqual({
      query: "AI market",
      results: [
        {
          title: "Market update",
          url: "https://example.com/market",
          snippet: "A short summary.",
          publishedDate: "2026-05-20",
        },
      ],
    });
  });

  it("requires a Tavily API key", async () => {
    delete process.env.TAVILY_API_KEY;

    await expect(searchWeb("AI market")).rejects.toThrow(
      "TAVILY_API_KEY is not set.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches extracted content for public HTTPS URLs", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              url: "https://example.com/report",
              title: "Report",
              raw_content: "Longer page text.",
            },
          ],
        }),
      ),
    );

    const result = await fetchUrl("https://example.com/report");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.tavily.com/extract",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ urls: ["https://example.com/report"] }),
      }),
    );
    expect(result).toEqual({
      url: "https://example.com/report",
      title: "Report",
      content: "Longer page text.",
    });
  });

  it("rejects non-HTTPS URLs before calling Tavily", async () => {
    await expect(fetchUrl("http://localhost:3000")).rejects.toThrow(
      "fetch_url only supports public HTTPS URLs.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
