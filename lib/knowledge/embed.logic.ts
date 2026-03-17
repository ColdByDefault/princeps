/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b";

export async function embedKnowledgeText(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_EMBED_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[knowledge] Ollama embedding failed:", details);
    throw new Error("Embedding request failed");
  }

  const payload = (await response.json()) as {
    embeddings?: number[][];
  };

  const embedding = payload.embeddings?.[0];

  if (!embedding) {
    throw new Error("Embedding response was empty");
  }

  return embedding;
}

export async function embedKnowledgeBatch(chunks: string[]) {
  const embeddings: number[][] = [];

  for (const chunk of chunks) {
    embeddings.push(await embedKnowledgeText(chunk));
  }

  return embeddings;
}
