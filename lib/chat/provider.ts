/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * Unified chat provider — single entry point for all LLM calls in the app.
 *
 * To switch providers set CHAT_PROVIDER in .env and restart:
 *   CHAT_PROVIDER=ollama   → local Ollama (default)
 *   CHAT_PROVIDER=groq     → Groq API
 *
 * To add a new provider:
 *   1. Create lib/chat/<name>.ts exporting callXxxChat + streamXxxChat
 *      with the same signatures used below.
 *   2. Add a branch in callChat, streamChat, and checkChatHealth.
 *   3. Set CHAT_PROVIDER=<name> in .env — nothing else needs to change.
 */

import "server-only";

import {
  callOllamaChat,
  streamOllamaChat,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
} from "@/lib/chat/ollama";
import {
  callGroqChat,
  streamGroqChat,
  GROQ_BASE_URL,
  GROQ_MODEL,
} from "@/lib/chat/groq";
import type {
  OllamaMessage,
  OllamaChatOptions,
  OllamaToolDefinition,
  OllamaChatResult,
} from "@/lib/chat/ollama";

// ─── Active provider ──────────────────────────────────────────────────────────

export const CHAT_PROVIDER = (
  process.env.CHAT_PROVIDER ?? "ollama"
).toLowerCase();

/** The model name that is currently active for chat / generation tasks. */
export const CHAT_MODEL: string =
  CHAT_PROVIDER === "groq" ? GROQ_MODEL : OLLAMA_MODEL;

// ─── Health check ─────────────────────────────────────────────────────────────

/**
 * Pings the active provider and returns true if it is reachable.
 * Used by /api/status — never throws.
 */
export async function checkChatHealth(): Promise<boolean> {
  try {
    if (CHAT_PROVIDER === "groq") {
      const res = await fetch(`${GROQ_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ""}`,
        },
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    }

    // Default: Ollama
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Chat functions ───────────────────────────────────────────────────────────
export function callChat(
  messages: OllamaMessage[],
  options?: OllamaChatOptions,
  tools?: OllamaToolDefinition[],
): Promise<OllamaChatResult> {
  if (CHAT_PROVIDER === "groq") {
    return callGroqChat(messages, options, tools);
  }
  return callOllamaChat(messages, options, tools);
}

export function streamChat(
  messages: OllamaMessage[],
  think: boolean,
  options?: OllamaChatOptions,
): Promise<Response> {
  if (CHAT_PROVIDER === "groq") {
    return streamGroqChat(messages, think, options);
  }
  return streamOllamaChat(messages, think, options);
}
