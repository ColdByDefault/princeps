/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

// ─── Settings Interface ────────────────────────────────────

export interface GroqSettings {
  /** Groq API key — required. */
  apiKey: string;
  /** Base URL — Groq OpenAI-compatible endpoint. */
  baseUrl: string;
  /** Model used for chat completions. */
  chatModel: string;
  /** Maximum output tokens per request. */
  maxTokens: number;
  /** Default sampling temperature (0–1). */
  temperature: number;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
}

// ─── Known Models ─────────────────────────────────────────

/** Curated list of tested Groq chat models. Consumed by UI model selectors. */
export const GROQ_CHAT_MODELS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
  "whisper-large-v3",
  "whisper-large-v3-turbo",
] as const;

export type GroqChatModel = (typeof GROQ_CHAT_MODELS)[number];

// ─── Error ────────────────────────────────────────────────

export class GroqProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "GroqProviderError";
  }
}

// ─── Settings Resolver ────────────────────────────────────

/**
 * Reads Groq configuration from environment variables with safe defaults.
 * Throws if `GROQ_API_KEY` is not set.
 *
 * Env vars:
 *   GROQ_API_KEY        — required
 *   GROQ_MODEL          — default: llama-3.3-70b-versatile
 *   GROQ_MAX_TOKENS     — default: 4096
 *   GROQ_TEMPERATURE    — default: 0.7
 *   GROQ_TIMEOUT_MS     — default: 30000
 */
export function getGroqSettings(): GroqSettings {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqProviderError("Groq API key is not configured.");
  }

  return {
    apiKey,
    baseUrl: "https://api.groq.com/openai/v1",
    chatModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    maxTokens: Number(process.env.GROQ_MAX_TOKENS) || 4_096,
    temperature: Number(process.env.GROQ_TEMPERATURE) || 0.7,
    timeoutMs: Number(process.env.GROQ_TIMEOUT_MS) || 30_000,
  };
}
