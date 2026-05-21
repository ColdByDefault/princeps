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

import { getOllamaSettings, OllamaProviderError } from "./ollama-settings";

// ─── Internal API Shape ───────────────────────────────────

interface OllamaEmbedApiResponse {
  model: string;
  embeddings: number[][];
}

// ─── Provider ─────────────────────────────────────────────

/**
 * Generates an embedding vector for a single text string.
 * Returns a flat float array whose length depends on the configured model.
 * Throws `OllamaProviderError` on failure or if the returned vector is empty.
 */
export async function embed(text: string): Promise<number[]> {
  const settings = getOllamaSettings();

  const response = await fetch(`${settings.baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input: text,
    }),
    signal: AbortSignal.timeout(settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OllamaProviderError(
      `Embedding failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as OllamaEmbedApiResponse;
  const vector = data.embeddings[0];

  if (!vector || vector.length === 0) {
    throw new OllamaProviderError("Ollama returned an empty embedding vector.");
  }

  return vector;
}

/**
 * Generates embedding vectors for multiple texts in a single request.
 * Preserves input order in the returned array.
 * Returns an empty array immediately if `texts` is empty.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const settings = getOllamaSettings();

  const response = await fetch(`${settings.baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input: texts,
    }),
    signal: AbortSignal.timeout(settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OllamaProviderError(
      `Batch embedding failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as OllamaEmbedApiResponse;
  return data.embeddings;
}
