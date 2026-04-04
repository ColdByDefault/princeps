/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type { KnowledgeDocumentRecord } from "@/types/api";

// ─── Constants ────────────────────────────────────────────

/** Target characters per chunk (approx 250 tokens). */
export const CHUNK_SIZE = 1_000;

/** Overlap between consecutive chunks to preserve context across boundaries. */
export const CHUNK_OVERLAP = 200;

/**
 * Vector dimension expected by the knowledge_chunk.embedding column.
 * Matches text-embedding-3-small / text-embedding-ada-002 output size.
 */
export const EMBEDDING_DIM = 1_536;

// ─── Text chunking ────────────────────────────────────────

/**
 * Splits text into overlapping chunks of approximately CHUNK_SIZE characters.
 * Prefers splitting at paragraph or sentence boundaries when they fall within
 * ±20 % of the target size. Falls back to word boundaries.
 *
 * Returns at least one chunk (the full text) even for very short inputs.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= CHUNK_SIZE) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    let slice = normalized.slice(start, end);

    if (end < normalized.length) {
      // Try to break at a paragraph boundary
      const paraBreak = slice.lastIndexOf("\n\n");
      if (paraBreak > CHUNK_SIZE * 0.6) {
        slice = slice.slice(0, paraBreak + 2);
      } else {
        // Try a single newline
        const lineBreak = slice.lastIndexOf("\n");
        if (lineBreak > CHUNK_SIZE * 0.6) {
          slice = slice.slice(0, lineBreak + 1);
        } else {
          // Try a space (word boundary)
          const spaceBreak = slice.lastIndexOf(" ");
          if (spaceBreak > CHUNK_SIZE * 0.5) {
            slice = slice.slice(0, spaceBreak + 1);
          }
        }
      }
    }

    chunks.push(slice.trim());
    // Advance by the chunk length minus overlap so consecutive chunks share context
    start += Math.max(slice.length - CHUNK_OVERLAP, 1);
  }

  return chunks.filter((c) => c.length > 0);
}

// ─── Vector normalization ─────────────────────────────────

/**
 * Ensures a vector has exactly `targetDim` dimensions.
 * - Truncates if longer
 * - Zero-pads if shorter
 *
 * This lets Ollama embedding models (768–1024 dims) be stored alongside
 * OpenAI models (1536 dims) in the same pgvector column.
 * Search quality degrades for mismatched dims, but it is technically sound.
 */
export function normalizeVector(
  v: number[],
  targetDim = EMBEDDING_DIM,
): number[] {
  if (v.length === targetDim) return v;
  if (v.length > targetDim) return v.slice(0, targetDim);
  const padded = new Array(targetDim).fill(0) as number[];
  for (let i = 0; i < v.length; i++) padded[i] = v[i]!;
  return padded;
}

// ─── Token approximation ──────────────────────────────────

/** Approximate token count using the 1 token ≈ 4 chars heuristic. */
export function charsToApproxTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

// ─── Shape mapping ────────────────────────────────────────

type DocumentRow = {
  id: string;
  name: string;
  charCount: number;
  createdAt: Date;
  labelLinks: { label: { id: string; name: string; color: string } }[];
};

export function toKnowledgeDocumentRecord(
  row: DocumentRow,
): KnowledgeDocumentRecord {
  return {
    id: row.id,
    name: row.name,
    charCount: row.charCount,
    labels: row.labelLinks.map((l) => l.label),
    createdAt: row.createdAt.toISOString(),
  };
}

export const KNOWLEDGE_DOCUMENT_SELECT = {
  id: true,
  name: true,
  charCount: true,
  createdAt: true,
  labelLinks: {
    select: {
      label: { select: { id: true, name: true, color: true } },
    },
  },
} as const;
