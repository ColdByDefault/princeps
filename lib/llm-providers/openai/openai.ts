/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { getOpenAISettings, OpenAIProviderError } from "./openai-settings";
import type { LLMMessage, LLMChatOptions, LLMChatResult } from "@/types/llm";

// ─── Public Types (re-exported aliases for this provider) ─

export type {
  LLMMessage as OpenAIMessage,
  LLMChatOptions as OpenAIChatOptions,
  LLMChatResult as OpenAIChatResult,
};

// ─── Internal API Shapes ──────────────────────────────────

interface OpenAIChatApiResponse {
  id: string;
  model: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface OpenAIStreamChunk {
  choices: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────

function authHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

// ─── Provider ─────────────────────────────────────────────

/**
 * Sends a blocking chat request to OpenAI and returns the full completion.
 * Throws `OpenAIProviderError` on non-2xx responses.
 */
export async function callChat(
  messages: LLMMessage[],
  options?: LLMChatOptions,
): Promise<LLMChatResult> {
  const settings = getOpenAISettings();

  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers: authHeaders(settings.apiKey),
    body: JSON.stringify({
      model: options?.model ?? settings.chatModel,
      messages,
      temperature: options?.temperature ?? settings.temperature,
      max_tokens: options?.contextLength ?? settings.maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OpenAIProviderError(
      `Chat call failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as OpenAIChatApiResponse;
  const choice = data.choices[0];

  if (!choice) {
    throw new OpenAIProviderError("OpenAI returned no choices.");
  }

  return {
    content: choice.message.content,
    model: data.model,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
  };
}

/**
 * Streams a chat response from OpenAI.
 * Yields content delta strings as they arrive via Server-Sent Events.
 *
 * @example
 * for await (const chunk of streamChat(messages)) {
 *   process.stdout.write(chunk);
 * }
 */
export async function* streamChat(
  messages: LLMMessage[],
  options?: LLMChatOptions,
): AsyncGenerator<string> {
  const settings = getOpenAISettings();

  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers: authHeaders(settings.apiKey),
    body: JSON.stringify({
      model: options?.model ?? settings.chatModel,
      messages,
      temperature: options?.temperature ?? settings.temperature,
      max_tokens: options?.contextLength ?? settings.maxTokens,
      stream: true,
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OpenAIProviderError(
      `Chat stream failed (${response.status}): ${body}`,
      response.status,
    );
  }

  if (!response.body) {
    throw new OpenAIProviderError("OpenAI returned an empty response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // SSE events are separated by "\n\n"
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? ""; // keep the last partial event

      for (const event of events) {
        // Each event may contain multiple "data: ..." lines; take the last data line
        const dataLine = event
          .split("\n")
          .filter((l) => l.startsWith("data: "))
          .pop();

        if (!dataLine) continue;
        const payload = dataLine.slice("data: ".length).trim();
        if (payload === "[DONE]") return;

        const chunk = JSON.parse(payload) as OpenAIStreamChunk;
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
