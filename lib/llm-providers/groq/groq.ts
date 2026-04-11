/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { getGroqSettings, GroqProviderError } from "./groq-settings";
import type {
  LLMMessage,
  LLMChatOptions,
  LLMChatResult,
  LLMToolCall,
} from "@/types/llm";

// ─── Public Types (re-exported aliases for this provider) ─

export type {
  LLMMessage as GroqMessage,
  LLMChatOptions as GroqChatOptions,
  LLMChatResult as GroqChatResult,
};

// ─── Internal API Shapes ──────────────────────────────────

interface GroqChatApiResponse {
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

interface GroqStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
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
 * Sends a blocking chat request to Groq and returns the full completion.
 * Groq exposes an OpenAI-compatible `/chat/completions` endpoint.
 * Throws `GroqProviderError` on non-2xx responses.
 */
export async function callChat(
  messages: LLMMessage[],
  options?: LLMChatOptions,
): Promise<LLMChatResult> {
  const settings = getGroqSettings();

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
    throw new GroqProviderError(
      `Chat call failed (${response.status}): ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as GroqChatApiResponse;
  const choice = data.choices[0];

  if (!choice) {
    throw new GroqProviderError("Groq returned no choices.");
  }

  return {
    content: choice.message.content,
    model: data.model,
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
  };
}

/**
 * Streams a chat response from Groq.
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
): AsyncGenerator<string | LLMToolCall> {
  const settings = getGroqSettings();

  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers: authHeaders(settings.apiKey),
    body: JSON.stringify({
      model: options?.model ?? settings.chatModel,
      messages,
      temperature: options?.temperature ?? settings.temperature,
      max_tokens: options?.contextLength ?? settings.maxTokens,
      stream: true,
      ...(options?.tools?.length && { tools: options.tools }),
    }),
    signal: AbortSignal.timeout(options?.timeoutMs ?? settings.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let friendlyMessage = `The AI provider returned an error (${response.status}).`;
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const inner = (parsed["error"] ?? parsed) as Record<string, unknown>;
      if (typeof inner["message"] === "string" && inner["message"].trim()) {
        friendlyMessage = inner["message"].trim();
      }
    } catch {
      /* ignore — use the fallback */
    }
    throw new GroqProviderError(friendlyMessage, response.status);
  }

  if (!response.body) {
    throw new GroqProviderError("Groq returned an empty response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const toolCallAccum: Record<
    number,
    { id: string; name: string; args: string }
  > = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // SSE events are separated by "\n\n"
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .filter((l) => l.startsWith("data: "))
          .pop();

        if (!dataLine) continue;
        const payload = dataLine.slice("data: ".length).trim();
        if (payload === "[DONE]") return;

        const chunk = JSON.parse(payload) as GroqStreamChunk;
        const choice = chunk.choices[0];
        if (!choice) continue;

        if (choice.delta.content) {
          yield choice.delta.content;
        }

        for (const tc of choice.delta.tool_calls ?? []) {
          if (!toolCallAccum[tc.index]) {
            toolCallAccum[tc.index] = {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              args: "",
            };
          } else {
            if (tc.id) toolCallAccum[tc.index].id = tc.id;
            if (tc.function?.name)
              toolCallAccum[tc.index].name += tc.function.name;
          }
          if (tc.function?.arguments) {
            toolCallAccum[tc.index].args += tc.function.arguments;
          }
        }

        if (choice.finish_reason === "tool_calls") {
          for (const accum of Object.values(toolCallAccum)) {
            const toolCall: LLMToolCall = {
              id: accum.id,
              type: "function",
              function: { name: accum.name, arguments: accum.args },
            };
            yield toolCall;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
