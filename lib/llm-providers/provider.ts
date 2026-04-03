/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * Active provider dispatcher — reads CHAT_PROVIDER at call time and
 * delegates to the configured provider.
 *
 * Supported values for CHAT_PROVIDER:
 *   "openAi"  — OpenAI API (default)
 *   "ollama"  — Ollama local server
 *   "groq"    — Groq API
 */

import "server-only";

import * as groq from "@/lib/llm-providers/groq/groq";
import * as groqEmbed from "@/lib/llm-providers/groq/groq-embedding";
import * as ollama from "@/lib/llm-providers/ollama/ollama";
import * as ollamaEmbed from "@/lib/llm-providers/ollama/ollama-embedding";
import * as openai from "@/lib/llm-providers/openai/openai";
import * as openaiEmbed from "@/lib/llm-providers/openai/openai-embedding";
import type { LLMChatOptions, LLMChatResult, LLMMessage } from "@/types/llm";

// ─── Provider Resolution ──────────────────────────────────

type Provider = "openAi" | "ollama" | "groq";

function getProvider(): Provider {
  const raw = process.env.CHAT_PROVIDER ?? "openAi";

  if (raw === "openAi" || raw === "ollama" || raw === "groq") {
    return raw;
  }

  throw new Error(
    `Unknown CHAT_PROVIDER value "${raw}". Expected "openAi", "ollama", or "groq".`,
  );
}

// ─── Chat ─────────────────────────────────────────────────

/**
 * Sends a blocking chat request to the configured provider.
 * Throws if the provider is unrecognised or not yet implemented.
 */
export async function callChat(
  messages: LLMMessage[],
  options?: LLMChatOptions,
): Promise<LLMChatResult> {
  const provider = getProvider();

  switch (provider) {
    case "openAi":
      return openai.callChat(messages, options);
    case "ollama":
      return ollama.callChat(messages, options);
    case "groq":
      return groq.callChat(messages, options);
  }
}

/**
 * Streams a chat response from the configured provider.
 * Yields content delta strings as they arrive.
 */
export async function* streamChat(
  messages: LLMMessage[],
  options?: LLMChatOptions,
): AsyncGenerator<string> {
  const provider = getProvider();

  switch (provider) {
    case "openAi":
      yield* openai.streamChat(messages, options);
      break;
    case "ollama":
      yield* ollama.streamChat(messages, options);
      break;
    case "groq":
      yield* groq.streamChat(messages, options);
      break;
  }
}

// ─── Embedding ────────────────────────────────────────────

/**
 * Generates an embedding vector for a single text string.
 * Uses the embedding model of the configured provider.
 */
export async function embed(text: string): Promise<number[]> {
  const provider = getProvider();

  switch (provider) {
    case "openAi":
      return openaiEmbed.embed(text);
    case "ollama":
      return ollamaEmbed.embed(text);
    case "groq":
      return groqEmbed.embed(text);
  }
}

/**
 * Generates embedding vectors for multiple texts in a single request.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const provider = getProvider();

  switch (provider) {
    case "openAi":
      return openaiEmbed.embedBatch(texts);
    case "ollama":
      return ollamaEmbed.embedBatch(texts);
    case "groq":
      return groqEmbed.embedBatch(texts);
  }
}
