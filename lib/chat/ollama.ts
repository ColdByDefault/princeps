/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:4b";

export const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? null;

export type OllamaToolCallEntry = {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
};

export type OllamaToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

export type OllamaMessage =
  | {
      role: "system" | "user" | "assistant";
      content: string;
      tool_calls?: never;
    }
  | { role: "assistant"; content: string; tool_calls: OllamaToolCallEntry[] }
  | { role: "tool"; content: string; tool_calls?: never };

export type OllamaStreamChunk = {
  model: string;
  message: {
    role: string;
    content: string;
    thinking?: string;
    tool_calls?: OllamaToolCallEntry[];
  };
  done: boolean;
  done_reason?: string;
};

export type OllamaChatOptions = {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_ctx?: number;
  repeat_penalty?: number;
};

/**
 * Opens a streaming connection to the local Ollama instance.
 * Returns the raw Response so the caller can pipe or iterate the body.
 *
 * @param messages  Full conversation array including the system prompt.
 * @param think     When true, passes think:true so Qwen3 emits reasoning
 *                  tokens in message.thinking (never shown to the user).
 * @param options   Optional inference parameters from user preferences.
 * @param tools     Optional tool definitions the model may call.
 */
export async function streamOllamaChat(
  messages: OllamaMessage[],
  think: boolean,
  options?: OllamaChatOptions,
  tools?: OllamaToolDefinition[],
): Promise<Response> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      think,
      ...(tools && tools.length > 0 ? { tools } : {}),
      ...(options && Object.keys(options).length > 0 ? { options } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  return response;
}
