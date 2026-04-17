/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

// ─── Settings Interface ────────────────────────────────────

export interface OpenAISettings {
  /** OpenAI API key — required. */
  apiKey: string;
  /** Base URL — override for Azure OpenAI or compatible proxies. */
  baseUrl: string;
  /** Model used for chat completions. */
  chatModel: string;
  /** Model used for text embeddings. */
  embeddingModel: string;
  /** Maximum output tokens per request. */
  maxTokens: number;
  /** Default sampling temperature (0–1). */
  temperature: number;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
}

// ─── Known Models ─────────────────────────────────────────

/** Curated list of tested OpenAI chat models. Consumed by UI model selectors. */
export const OPENAI_CHAT_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
] as const;

export type OpenAIChatModel = (typeof OPENAI_CHAT_MODELS)[number];

/** Curated list of tested OpenAI embedding models. */
export const OPENAI_EMBEDDING_MODELS = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
] as const;

export type OpenAIEmbeddingModel = (typeof OPENAI_EMBEDDING_MODELS)[number];

// ─── Error ────────────────────────────────────────────────

export class OpenAIProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "OpenAIProviderError";
  }
}

// ─── Settings Resolver ────────────────────────────────────

/**
 * Reads OpenAI configuration from environment variables with safe defaults.
 * Throws if `OPENAI_API_KEY` is not set.
 *
 * Env vars:
 *   OPENAI_API_KEY          — required
 *   OPENAI_BASE_URL         — default: https://api.openai.com/v1
 *   OPENAI_CHAT_MODEL       — default: gpt-4o-mini
 *   OPENAI_EMBEDDING_MODEL  — default: text-embedding-3-small
 *   OPENAI_MAX_TOKENS       — default: 4096
 *   OPENAI_TEMPERATURE      — default: 0.7
 *   OPENAI_TIMEOUT_MS       — default: 30000
 */
export function getOpenAISettings(): OpenAISettings {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIProviderError("OpenAI API key is not configured.");
  }

  return {
    apiKey,
    baseUrl:
      process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ??
      "https://api.openai.com/v1",
    chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 4_096,
    temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || 30_000,
  };
}
