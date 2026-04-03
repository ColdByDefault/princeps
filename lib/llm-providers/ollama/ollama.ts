/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { getOllamaSettings, OllamaProviderError } from "./ollama-settings";

// ─── Public Types ─────────────────────────────────────────

export type OllamaMessageRole = "system" | "user" | "assistant";

export interface OllamaMessage {
  role: OllamaMessageRole;
  content: string;
}

export interface OllamaChatOptions {
  /** Override the configured chat model for this request. */
  model?: string;
  /** Sampling temperature (0–1). Defaults to settings. */
  temperature?: number;
  /** Context window size in tokens. Defaults to settings. */
  contextLength?: number;
  /** Request timeout in ms. Defaults to settings. */
  timeoutMs?: number;
}

export interface OllamaChatResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

// ─── Internal API Shapes ──────────────────────────────────

interface OllamaChatApiResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaChatStreamChunk {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

// ─── Provider ─────────────────────────────────────────────

/**
 * Sends a blocking chat request to Ollama and returns the full completion.
 * Throws `OllamaProviderError` on non-2xx responses.
 */
export async function callChat(
  messages: OllamaMessage[],
  options?: OllamaChatOptions,
): Promise<OllamaChatResult> {
  const settings = getOllamaSettings();

  const response = await fetch(`${settings.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options?.model ?? settings.chatModel,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? settings.temperature,
        num_ctx: options?.contextLength ?? settings.contextLength,
      },
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OllamaProviderError(
      `Chat call failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as OllamaChatApiResponse;

  return {
    content: data.message.content,
    model: data.model,
    promptTokens: data.prompt_eval_count ?? 0,
    completionTokens: data.eval_count ?? 0,
  };
}

/**
 * Streams a chat response from Ollama.
 * Yields content delta strings as they arrive via NDJSON.
 *
 * @example
 * for await (const chunk of streamChat(messages)) {
 *   process.stdout.write(chunk);
 * }
 */
export async function* streamChat(
  messages: OllamaMessage[],
  options?: OllamaChatOptions,
): AsyncGenerator<string> {
  const settings = getOllamaSettings();

  const response = await fetch(`${settings.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options?.model ?? settings.chatModel,
      messages,
      stream: true,
      options: {
        temperature: options?.temperature ?? settings.temperature,
        num_ctx: options?.contextLength ?? settings.contextLength,
      },
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OllamaProviderError(
      `Chat stream failed (${response.status}): ${body}`,
      response.status,
    );
  }

  if (!response.body) {
    throw new OllamaProviderError("Ollama returned an empty response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep the last partial line in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const chunk = JSON.parse(trimmed) as OllamaChatStreamChunk;
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
        if (chunk.done) return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
