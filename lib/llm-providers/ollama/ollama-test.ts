/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { callChat } from "./ollama";
import { embed } from "./ollama-embedding";
import { getOllamaSettings } from "./ollama-settings";

// ─── Types ────────────────────────────────────────────────

export interface OllamaTestResult {
  success: boolean;
  /** Identifies what was tested, e.g. "chat:llama3.2" or "embed:nomic-embed-text". */
  label: string;
  durationMs: number;
  /** Human-readable summary of the result on success. */
  detail: string | null;
  error: string | null;
}

// ─── Test Runners ─────────────────────────────────────────

/**
 * Sends a minimal chat message and verifies Ollama responds with content.
 * Uses the currently configured chat model and default options.
 */
export async function testOllamaChat(
  message = "Reply with only the word 'ok'.",
): Promise<OllamaTestResult> {
  const { chatModel } = getOllamaSettings();
  const start = Date.now();

  try {
    const result = await callChat([{ role: "user", content: message }]);
    const content = result.content.trim();

    if (!content) {
      return {
        success: false,
        label: `chat:${chatModel}`,
        durationMs: Date.now() - start,
        detail: null,
        error: "Ollama responded but returned empty content.",
      };
    }

    return {
      success: true,
      label: `chat:${chatModel}`,
      durationMs: Date.now() - start,
      detail: content,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      label: `chat:${chatModel}`,
      durationMs: Date.now() - start,
      detail: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Generates an embedding for a short text and verifies the vector is non-empty.
 * Returns a summary string with the vector dimensions and first three values.
 */
export async function testOllamaEmbedding(
  text = "Embedding test.",
): Promise<OllamaTestResult> {
  const { embeddingModel } = getOllamaSettings();
  const start = Date.now();

  try {
    const vector = await embed(text);
    const preview = vector
      .slice(0, 3)
      .map((v) => v.toFixed(4))
      .join(", ");

    return {
      success: true,
      label: `embed:${embeddingModel}`,
      durationMs: Date.now() - start,
      detail: `${vector.length}d vector — [${preview}, ...]`,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      label: `embed:${embeddingModel}`,
      durationMs: Date.now() - start,
      detail: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
