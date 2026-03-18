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
const OLLAMA_DISABLE_THINKING = process.env.OLLAMA_DISABLE_THINKING !== "false";

function addNoThinkingInstruction(messages: ProviderMessage[]) {
  if (!OLLAMA_DISABLE_THINKING) {
    return messages;
  }

  return messages.map((message, index) => {
    if (index === 0 && message.role === "system") {
      return {
        ...message,
        content: `${message.content}\n\nReturn only the final answer. Do not output thinking, reasoning traces, or <think> blocks.`,
      };
    }

    if (index === messages.length - 1 && message.role === "user") {
      return {
        ...message,
        content: `/no_think\n${message.content}`,
      };
    }

    return message;
  });
}

function stripThinkingBlocks(content: string) {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function buildRetryMessages(messages: ProviderMessage[]) {
  return messages.map((message, index) => {
    if (index === 0 && message.role === "system") {
      return {
        ...message,
        content: `${message.content}\n\nRespond with a short plain-text final answer. Do not leave the answer empty.`,
      };
    }

    if (index === messages.length - 1 && message.role === "user") {
      return {
        ...message,
        content: `${message.content}\n\nAnswer now with plain text only.`,
      };
    }

    return message;
  });
}

async function requestChatCompletion(messages: ProviderMessage[]) {
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

  return stripThinkingBlocks(payload.message.content).trim();
}

export async function sendChatCompletion(messages: ProviderMessage[]) {
  const requestMessages = addNoThinkingInstruction(messages);
  let content = await requestChatCompletion(requestMessages);

  if (!content) {
    content = await requestChatCompletion(buildRetryMessages(requestMessages));
  }

  if (!content) {
    throw new Error("LLM response was empty");
  }

  return content;
}
