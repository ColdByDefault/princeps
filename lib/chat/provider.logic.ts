/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { type ProviderMessage } from "@/lib/chat/shared.logic";

interface OllamaChatResponse {
  message: { content: string };
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:9b";

export async function sendChatCompletion(messages: ProviderMessage[]) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        num_predict: Number(process.env.OLLAMA_MAX_TOKENS ?? 600),
        temperature: Number(process.env.OLLAMA_TEMPERATURE ?? 0.2),
        top_p: Number(process.env.OLLAMA_TOP_P ?? 0.9),
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[chat] Ollama request failed:", details);
    throw new Error("LLM request failed");
  }

  const payload = (await response.json()) as OllamaChatResponse;

  return payload.message.content;
}
