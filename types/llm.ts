/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Shared type contracts used by all LLM providers.
 * No provider-specific logic or imports — safe to import from any layer.
 */

// ─── Message / Chat ───────────────────────────────────────

export type LLMMessageRole = "system" | "user" | "assistant" | "tool";

export interface LLMMessage {
  role: LLMMessageRole;
  /** Null only on assistant messages that contain tool_calls and no text. */
  content: string | null;
  /** Populated when the assistant is requesting tool calls (role: "assistant"). */
  tool_calls?: LLMToolCall[];
  /** Required when role is "tool" — references the tool_call id being answered. */
  tool_call_id?: string;
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
  /** Tools the LLM can call (OpenAI function-calling format). */
  tools?: LLMTool[];
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

// ─── Settings / Status ────────────────────────────────────

export type ActiveProvider = "openAi" | "ollama" | "groq";

export interface ProviderEntry {
  provider: ActiveProvider;
  health: ProviderHealthStatus;
}

/** Serialisable status payload returned by the provider-status API. */
export interface ProviderStatusPayload {
  active: ActiveProvider;
  activeModel: string;
  providers: ProviderEntry[];
}

// ─── Tools ────────────────────────────────────────────────

export interface LLMToolFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMTool {
  type: "function";
  function: LLMToolFunction;
}

/** A tool call requested by the LLM in a streamed response. */
export interface LLMToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON-stringified arguments
  };
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
