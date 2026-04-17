/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

// ─── Settings Interface ────────────────────────────────────

export interface OllamaSettings {
  /** Base URL for the Ollama HTTP API (default: http://localhost:11434). */
  baseUrl: string;
  /** Model used for chat completions. */
  chatModel: string;
  /** Model used for text embeddings. */
  embeddingModel: string;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
  /** Context window size in tokens (num_ctx). */
  contextLength: number;
  /** Default sampling temperature (0–1). */
  temperature: number;
}

// ─── Known Models ─────────────────────────────────────────

/** Curated list of tested Ollama chat models. Consumed by UI model selectors. */
export const OLLAMA_CHAT_MODELS = [
  "llama3.2",
  "llama3.1",
  "mistral",
  "gemma3",
  "phi4",
  "deepseek-r1:8b",
] as const;

export type OllamaChatModel = (typeof OLLAMA_CHAT_MODELS)[number];

/** Curated list of tested Ollama embedding models. */
export const OLLAMA_EMBEDDING_MODELS = [
  "nomic-embed-text",
  "mxbai-embed-large",
  "all-minilm",
] as const;

export type OllamaEmbeddingModel = (typeof OLLAMA_EMBEDDING_MODELS)[number];

// ─── Error ────────────────────────────────────────────────

export class OllamaProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "OllamaProviderError";
  }
}

// ─── Settings Resolver ────────────────────────────────────

/**
 * Reads Ollama configuration from environment variables with safe defaults.
 * Called at request time so env changes are always reflected.
 *
 * Env vars:
 *   OLLAMA_BASE_URL         — default: http://localhost:11434
 *   OLLAMA_CHAT_MODEL       — default: llama3.2
 *   OLLAMA_EMBEDDING_MODEL  — default: nomic-embed-text
 *   OLLAMA_TIMEOUT_MS       — default: 30000
 *   OLLAMA_CONTEXT_LENGTH   — default: 4096
 *   OLLAMA_TEMPERATURE      — default: 0.7
 */
export function getOllamaSettings(): OllamaSettings {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? "llama3.2",
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text",
    // Number(undefined) = NaN which is falsy → falls back to default
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 30_000,
    contextLength: Number(process.env.OLLAMA_CONTEXT_LENGTH) || 4_096,
    temperature: Number(process.env.OLLAMA_TEMPERATURE) || 0.7,
  };
}
