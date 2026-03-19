/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:4b";

export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OllamaStreamChunk = {
  model: string;
  message: {
    role: string;
    content: string;
    thinking?: string;
  };
  done: boolean;
};

/**
 * Opens a streaming connection to the local Ollama instance.
 * Returns the raw Response so the caller can pipe or iterate the body.
 *
 * @param messages  Full conversation array including the system prompt.
 * @param think     When true, passes think:true so Qwen3 emits reasoning
 *                  tokens in message.thinking (never shown to the user).
 */
export async function streamOllamaChat(
  messages: OllamaMessage[],
  think: boolean,
): Promise<Response> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      think,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  return response;
}
