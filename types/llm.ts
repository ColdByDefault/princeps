/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * Shared type contracts used by all LLM providers.
 * No provider-specific logic or imports — safe to import from any layer.
 */

// ─── Message / Chat ───────────────────────────────────────

export type LLMMessageRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

/** Base options accepted by every provider's callChat / streamChat. */
export interface LLMChatOptions {
  /** Override the configured model for this request. */
  model?: string;
  /** Sampling temperature (0–1). */
  temperature?: number;
  /**
   * Max tokens for the response.
   * Ollama maps this to `num_ctx`; OpenAI maps it to `max_tokens`.
   */
  contextLength?: number;
  /** Request timeout in ms. */
  timeoutMs?: number;
}

export interface LLMChatResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

// ─── Embedding ────────────────────────────────────────────

export interface LLMEmbedResult {
  embeddings: number[][];
  model: string;
}

// ─── Health ───────────────────────────────────────────────

export interface ProviderModelInfo {
  name: string;
  /** File size in bytes — populated by local providers (Ollama), null for API providers. */
  size: number | null;
  modifiedAt: string | null;
}

export interface ProviderHealthStatus {
  connected: boolean;
  /** Server version string where available; null for providers that don't expose it. */
  version: string | null;
  models: ProviderModelInfo[];
  error: string | null;
}

// ─── Test ─────────────────────────────────────────────────

export interface ProviderTestResult {
  success: boolean;
  /** Identifies what was tested, e.g. "chat:gpt-4o-mini" or "embed:nomic-embed-text". */
  label: string;
  durationMs: number;
  /** Human-readable summary on success. */
  detail: string | null;
  error: string | null;
}
