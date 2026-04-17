/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { getOpenAISettings, OpenAIProviderError } from "./openai-settings";

// ─── Internal API Shape ───────────────────────────────────

interface OpenAIEmbedApiResponse {
  object: "list";
  data: Array<{
    object: "embedding";
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

// ─── Provider ─────────────────────────────────────────────

/**
 * Generates an embedding vector for a single text string.
 * Returns a flat float array whose length depends on the configured model.
 * Throws `OpenAIProviderError` on failure or if the returned vector is empty.
 */
export async function embed(text: string): Promise<number[]> {
  const settings = getOpenAISettings();

  const response = await fetch(`${settings.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input: text,
    }),
    signal: AbortSignal.timeout(settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OpenAIProviderError(
      `Embedding failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as OpenAIEmbedApiResponse;
  const vector = data.data[0]?.embedding;

  if (!vector || vector.length === 0) {
    throw new OpenAIProviderError("OpenAI returned an empty embedding vector.");
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

  const settings = getOpenAISettings();

  const response = await fetch(`${settings.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input: texts,
    }),
    signal: AbortSignal.timeout(settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OpenAIProviderError(
      `Batch embedding failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as OpenAIEmbedApiResponse;
  // OpenAI guarantees index-ordered results but sort defensively
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
