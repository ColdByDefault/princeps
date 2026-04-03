/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import {
  checkOllamaHealth,
  checkOpenAIHealth,
} from "@/lib/llm-providers/shared/provider-health";
import type {
  ActiveProvider,
  ProviderHealthStatus,
  ProviderStatusPayload,
} from "@/types/llm";

// ─── Logic ────────────────────────────────────────────────

export async function getProviderStatus(): Promise<ProviderStatusPayload> {
  const raw = process.env.CHAT_PROVIDER ?? "openAi";
  const active: ActiveProvider =
    raw === "openAi" || raw === "ollama" || raw === "groq" ? raw : "openAi";

  const [openAiHealth, ollamaHealth] = await Promise.all([
    checkOpenAIHealth(),
    checkOllamaHealth(),
  ]);

  const groqHealth: ProviderHealthStatus = {
    connected: false,
    version: null,
    models: [],
    error: null,
  };

  return {
    active,
    providers: [
      { provider: "openAi", health: openAiHealth },
      { provider: "ollama", health: ollamaHealth },
      { provider: "groq", health: groqHealth },
    ],
  };
}
