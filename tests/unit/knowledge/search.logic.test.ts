import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KnowledgeSearchResult } from "@/lib/features/knowledge/search.logic";

type QueryRawUnsafe = (
  sql: string,
  userId: string,
  vectorLiteral: string,
  minSimilarity: number,
  topK: number,
  sourceType?: string,
) => Promise<
  {
    chunk_id: string;
    document_id: string;
    document_name: string;
    content: string;
    similarity: number | string;
  }[]
>;

const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  embed: vi.fn<() => Promise<number[]>>(),
  queryRawUnsafe: vi.fn<QueryRawUnsafe>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    $queryRawUnsafe: mocks.queryRawUnsafe,
  },
}));

vi.mock("@/lib/ai/llm-providers/provider", () => ({
  embed: mocks.embed,
}));

vi.mock("@/lib/platform/tiers/enforce", () => ({
  accumulateTokens: mocks.accumulateTokens,
}));

import { searchKnowledge } from "@/lib/features/knowledge/search.logic";

describe("searchKnowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accumulateTokens.mockResolvedValue();
    mocks.embed.mockResolvedValue([0.1, 0.2]);
    mocks.queryRawUnsafe.mockResolvedValue([
      {
        chunk_id: "chunk-1",
        document_id: "doc-1",
        document_name: "Board notes.md",
        content: "Launch context",
        similarity: "0.82",
      },
    ]);
  });

  it("embeds the query, searches scoped chunks, and maps raw rows", async () => {
    const results = await searchKnowledge("user-1", "launch context", 3, 0.5);

    expect(mocks.embed).toHaveBeenCalledWith("launch context");
    expect(mocks.accumulateTokens).toHaveBeenCalledWith(
      "user-1",
      "launch context".length,
      0,
    );
    const queryArgs = mocks.queryRawUnsafe.mock.calls[0];
    expect(queryArgs?.[0]).toContain('WHERE kc."userId" = $1');
    expect(queryArgs?.[0]).not.toContain("kd.source_type = $5");
    expect(queryArgs?.[1]).toBe("user-1");
    expect(queryArgs?.[2]).toMatch(/^\[0\.1,0\.2,0,/);
    expect(queryArgs?.[3]).toBe(0.5);
    expect(queryArgs?.[4]).toBe(3);

    const expectedResults: KnowledgeSearchResult[] = [
      {
        chunkId: "chunk-1",
        documentId: "doc-1",
        documentName: "Board notes.md",
        content: "Launch context",
        similarity: 0.82,
      },
    ];
    expect(results).toEqual(expectedResults);
  });

  it("adds a source type filter when provided", async () => {
    await searchKnowledge("user-1", "launch context", 5, 0.3, "drive");

    const queryArgs = mocks.queryRawUnsafe.mock.calls[0];
    expect(queryArgs?.[0]).toContain("AND kd.source_type = $5");
    expect(queryArgs?.[5]).toBe("drive");
  });
});
