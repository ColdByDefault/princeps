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
import {
  tracedCallChat,
  tracedEmbed,
  tracedStreamChat,
} from "@/lib/llm-providers/observability";
import * as openai from "@/lib/llm-providers/openai/openai";
import * as openaiEmbed from "@/lib/llm-providers/openai/openai-embedding";
import type {
  LLMChatOptions,
  LLMChatResult,
  LLMMessage,
  LLMToolCall,
} from "@/types/llm";

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

  return tracedCallChat(provider, messages, options, (msgs, opts) => {
    switch (provider) {
      case "openAi":
        return openai.callChat(msgs, opts);
      case "ollama":
        return ollama.callChat(msgs, opts);
      case "groq":
        return groq.callChat(msgs, opts);
    }
  });
}

/**
 * Streams a chat response from the configured provider.
 * Yields content delta strings as they arrive.
 */
export async function* streamChat(
  messages: LLMMessage[],
  options?: LLMChatOptions,
): AsyncGenerator<string | LLMToolCall> {
  const provider = getProvider();

  yield* tracedStreamChat(provider, messages, options, (msgs, opts) => {
    switch (provider) {
      case "openAi":
        return openai.streamChat(msgs, opts);
      case "ollama":
        return ollama.streamChat(msgs, opts);
      case "groq":
        return groq.streamChat(msgs, opts);
    }
  });
}

// ─── Embedding ────────────────────────────────────────────

/**
 * Generates an embedding vector for a single text string.
 * Uses the embedding model of the configured provider.
 */
export async function embed(text: string): Promise<number[]> {
  const provider = getProvider();

  return tracedEmbed(provider, text, (t) => {
    switch (provider) {
      case "openAi":
        return openaiEmbed.embed(t);
      case "ollama":
        return ollamaEmbed.embed(t);
      case "groq":
        return groqEmbed.embed(t);
    }
  });
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
