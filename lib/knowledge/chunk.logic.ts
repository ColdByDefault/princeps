/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

/**
 * Splits plain text into overlapping chunks suitable for embedding.
 * Uses a simple character-based splitter (~500 words ≈ 2500 chars, 250 char overlap).
 */
const CHUNK_SIZE = 2500;
const CHUNK_OVERLAP = 250;

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}
