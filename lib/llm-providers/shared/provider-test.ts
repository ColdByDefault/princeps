/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Test runners for all LLM providers — one file, one import.
 * Each function returns a structured result; never throws.
 */

import "server-only";

import { callChat as ollamaCallChat } from "../ollama/ollama";
import { embed as ollamaEmbed } from "../ollama/ollama-embedding";
import { getOllamaSettings } from "../ollama/ollama-settings";
import { callChat as openaiCallChat } from "../openai/openai";
import { embed as openaiEmbed } from "../openai/openai-embedding";
import { getOpenAISettings } from "../openai/openai-settings";
import type { ProviderTestResult } from "@/types/llm";

// ─── Shared helper ────────────────────────────────────────

async function runEmbedTest(
  label: string,
  embedFn: (text: string) => Promise<number[]>,
  text: string,
): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const vector = await embedFn(text);
    const preview = vector
      .slice(0, 3)
      .map((v) => v.toFixed(4))
      .join(", ");
    return {
      success: true,
      label,
      durationMs: Date.now() - start,
      detail: `${vector.length}d vector — [${preview}, ...]`,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      label,
      durationMs: Date.now() - start,
      detail: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Ollama ───────────────────────────────────────────────

/**
 * Sends a minimal chat message and verifies Ollama responds with content.
 */
export async function testOllamaChat(
  message = "Reply with only the word 'ok'.",
): Promise<ProviderTestResult> {
  const { chatModel } = getOllamaSettings();
  const start = Date.now();

  try {
    const result = await ollamaCallChat([{ role: "user", content: message }]);
    const content = result.content.trim();

    if (!content) {
      return {
        success: false,
        label: `chat:${chatModel}`,
        durationMs: Date.now() - start,
        detail: null,
        error: "Ollama responded but returned empty content.",
      };
    }

    return {
      success: true,
      label: `chat:${chatModel}`,
      durationMs: Date.now() - start,
      detail: content,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      label: `chat:${chatModel}`,
      durationMs: Date.now() - start,
      detail: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Generates an embedding for a short text and verifies the vector is non-empty.
 */
export async function testOllamaEmbedding(
  text = "Embedding test.",
): Promise<ProviderTestResult> {
  const { embeddingModel } = getOllamaSettings();
  return runEmbedTest(`embed:${embeddingModel}`, ollamaEmbed, text);
}

// ─── OpenAI ───────────────────────────────────────────────

/**
 * Sends a minimal chat message and verifies OpenAI responds with content.
 */
export async function testOpenAIChat(
  message = "Reply with only the word 'ok'.",
): Promise<ProviderTestResult> {
  const { chatModel } = getOpenAISettings();
  const start = Date.now();

  try {
    const result = await openaiCallChat([{ role: "user", content: message }]);
    const content = result.content.trim();

    if (!content) {
      return {
        success: false,
        label: `chat:${chatModel}`,
        durationMs: Date.now() - start,
        detail: null,
        error: "OpenAI responded but returned empty content.",
      };
    }

    return {
      success: true,
      label: `chat:${chatModel}`,
      durationMs: Date.now() - start,
      detail: content,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      label: `chat:${chatModel}`,
      durationMs: Date.now() - start,
      detail: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Generates an embedding for a short text and verifies the vector is non-empty.
 */
export async function testOpenAIEmbedding(
  text = "Embedding test.",
): Promise<ProviderTestResult> {
  const { embeddingModel } = getOpenAISettings();
  return runEmbedTest(`embed:${embeddingModel}`, openaiEmbed, text);
}
