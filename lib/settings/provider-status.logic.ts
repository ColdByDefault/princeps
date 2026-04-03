/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import {
  checkOllamaHealth,
  checkOpenAIHealth,
  checkGroqHealth,
} from "@/lib/llm-providers/shared/provider-health";
import type { ActiveProvider, ProviderStatusPayload } from "@/types/llm";

// ─── Logic ────────────────────────────────────────────────

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
    providers: [
      { provider: "openAi", health: openAiHealth },
      { provider: "ollama", health: ollamaHealth },
      { provider: "groq", health: groqHealth },
    ],
  };
}
