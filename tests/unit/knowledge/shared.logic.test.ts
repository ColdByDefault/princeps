import { describe, expect, it } from "vitest";
import type { KnowledgeDocumentRecord } from "@/types/api";
import {
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  charsToApproxTokens,
  chunkText,
  normalizeVector,
  toKnowledgeDocumentRecord,
} from "@/lib/features/knowledge/shared.logic";

describe("knowledge shared logic", () => {
  it("chunks short text as a single trimmed chunk", () => {
    expect(chunkText("  Short note.\n")).toEqual(["Short note."]);
  });

  it("chunks long text into overlapping non-empty chunks", () => {
    const text = Array.from({ length: 260 }, (_, index) => `word${index}`).join(
      " ",
    );

    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
    expect(chunks[0]!.length).toBeLessThanOrEqual(CHUNK_SIZE);
    expect(chunks[1]!.length).toBeGreaterThan(CHUNK_OVERLAP);
  });

  it("normalizes vectors by keeping, truncating, or padding dimensions", () => {
    expect(normalizeVector([1, 2], 2)).toEqual([1, 2]);
    expect(normalizeVector([1, 2, 3], 2)).toEqual([1, 2]);
    expect(normalizeVector([1], 3)).toEqual([1, 0, 0]);
  });

  it("approximates tokens from character counts", () => {
    expect(charsToApproxTokens(1)).toBe(1);
    expect(charsToApproxTokens(8)).toBe(2);
    expect(charsToApproxTokens(9)).toBe(3);
  });

  it("maps document rows to client-safe records", () => {
    const record = toKnowledgeDocumentRecord({
      id: "doc-1",
      name: "Board notes.md",
      charCount: 123,
      sourceType: null,
      createdAt: new Date("2026-05-22T06:00:00.000Z"),
      labelLinks: [
        {
          label: {
            id: "label-1",
            name: "Board",
            color: "#2563eb",
          },
        },
      ],
    });

    const expectedRecord: KnowledgeDocumentRecord = {
      id: "doc-1",
      name: "Board notes.md",
      charCount: 123,
      sourceType: null,
      labels: [{ id: "label-1", name: "Board", color: "#2563eb" }],
      createdAt: "2026-05-22T06:00:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });
});
