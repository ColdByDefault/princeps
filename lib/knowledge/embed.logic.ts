/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL } from "@/lib/chat/ollama";

/**
 * Embeds a single text string via the Ollama /api/embed endpoint.
 * The model is controlled by the OLLAMA_EMBED_MODEL env var.
 * Throws if the env var is not set or the request fails.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = OLLAMA_EMBED_MODEL;
  if (!model) {
    throw new Error(
      "OLLAMA_EMBED_MODEL env var is not set. Set it to your embedding model (e.g. nomic-embed-text).",
    );
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embed returned ${response.status}`);
  }

  const data = (await response.json()) as { embeddings: number[][] };
  const embedding = data.embeddings?.[0];

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Ollama embed returned an empty embedding.");
  }

  return embedding;
}
