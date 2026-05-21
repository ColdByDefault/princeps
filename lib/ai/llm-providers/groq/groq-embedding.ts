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

import { GroqProviderError } from "./groq-settings";

/**
 * Groq does not provide a native text-embedding API.
 * These stubs throw descriptive errors so callers surface a clear message
 * rather than a generic "not implemented" crash.
 */

export async function embed(_text: string): Promise<number[]> {
  throw new GroqProviderError(
    "Groq does not support text embeddings. Switch to openAi or ollama for embedding operations.",
  );
}

export async function embedBatch(_texts: string[]): Promise<number[][]> {
  throw new GroqProviderError(
    "Groq does not support text embeddings. Switch to openAi or ollama for embedding operations.",
  );
}
