/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import {
  checkOllamaHealth,
  checkOpenAIHealth,
  checkGroqHealth,
} from "@/lib/llm-providers/shared/provider-health";
import type { ActiveProvider, ProviderStatusPayload } from "@/types/llm";

// ─── Logic ────────────────────────────────────────────────

function resolveActiveModel(active: ActiveProvider): string {
  switch (active) {
    case "openAi":
      return process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
    case "ollama":
      return process.env.OLLAMA_CHAT_MODEL ?? "llama3.2";
    case "groq":
      return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  }
}

export async function getProviderStatus(): Promise<ProviderStatusPayload> {
  const raw = process.env.CHAT_PROVIDER ?? "openAi";
  const active: ActiveProvider =
    raw === "openAi" || raw === "ollama" || raw === "groq" ? raw : "openAi";

  const [openAiHealth, ollamaHealth, groqHealth] = await Promise.all([
    checkOpenAIHealth(),
    checkOllamaHealth(),
    checkGroqHealth(),
  ]);

  return {
    active,
    activeModel: resolveActiveModel(active),
    providers: [
      { provider: "openAi", health: openAiHealth },
      { provider: "ollama", health: ollamaHealth },
      { provider: "groq", health: groqHealth },
    ],
  };
}
