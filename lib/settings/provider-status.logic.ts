/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import {
  checkOllamaHealth,
  checkOpenAIHealth,
} from "@/lib/llm-providers/shared/provider-health";
import type { ProviderHealthStatus } from "@/types/llm";

// ─── Types ────────────────────────────────────────────────

export type ActiveProvider = "openAi" | "ollama" | "groq";

export interface ProviderStatusResult {
  provider: ActiveProvider;
  health: ProviderHealthStatus;
}

// ─── Logic ────────────────────────────────────────────────

export async function getProviderStatus(): Promise<ProviderStatusResult> {
  const raw = process.env.CHAT_PROVIDER ?? "openAi";
  const provider: ActiveProvider =
    raw === "openAi" || raw === "ollama" || raw === "groq" ? raw : "openAi";

  let health: ProviderHealthStatus;

  switch (provider) {
    case "openAi":
      health = await checkOpenAIHealth();
      break;
    case "ollama":
      health = await checkOllamaHealth();
      break;
    case "groq":
      health = {
        connected: false,
        version: null,
        models: [],
        error: "Groq provider is not yet implemented.",
      };
      break;
  }

  return { provider, health };
}
