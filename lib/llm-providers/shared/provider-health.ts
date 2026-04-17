/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Health checks for all LLM providers — one file, one import.
 * Always resolves, never throws. Errors are captured in `result.error`.
 */

import "server-only";

import { getGroqSettings, GROQ_CHAT_MODELS } from "../groq/groq-settings";
import { getOllamaSettings } from "../ollama/ollama-settings";
import {
  getOpenAISettings,
  OPENAI_CHAT_MODELS,
  OPENAI_EMBEDDING_MODELS,
} from "../openai/openai-settings";
import type { ProviderHealthStatus, ProviderModelInfo } from "@/types/llm";

// ─── Internal Shapes ──────────────────────────────────────

interface OllamaVersionResponse {
  version: string;
}

interface OllamaTagsResponse {
  models: Array<{ name: string; size: number; modified_at: string }>;
}

interface OpenAIModelsResponse {
  object: "list";
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

// ─── Ollama ───────────────────────────────────────────────

/**
 * Checks whether the Ollama server is reachable and returns its version
 * and the list of locally available models.
 */
export async function checkOllamaHealth(): Promise<ProviderHealthStatus> {
  const { baseUrl } = getOllamaSettings();

  try {
    const [versionRes, tagsRes] = await Promise.all([
      fetch(`${baseUrl}/api/version`, { signal: AbortSignal.timeout(5_000) }),
      fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5_000) }),
    ]);

    if (!versionRes.ok || !tagsRes.ok) {
      return {
        connected: false,
        version: null,
        models: [],
        error: `Ollama responded with an error (version: ${versionRes.status}, tags: ${tagsRes.status}).`,
      };
    }

    const { version } = (await versionRes.json()) as OllamaVersionResponse;
    const { models } = (await tagsRes.json()) as OllamaTagsResponse;

    return {
      connected: true,
      version,
      models: models.map((m) => ({
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at,
      })),
      error: null,
    };
  } catch (err) {
    const msg =
      err instanceof Error &&
      (err.message.toLowerCase() === "fetch failed" ||
        err.message.toLowerCase().includes("econnrefused") ||
        err.message.toLowerCase().includes("network"))
        ? "Ollama is not running or not reachable."
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return {
      connected: false,
      version: null,
      models: [],
      error: msg,
    };
  }
}

// ─── OpenAI ───────────────────────────────────────────────

/**
 * Checks whether the OpenAI API is reachable with the configured key and
 * returns a curated subset of available models (chat + embedding capable).
 *
 * Note: OpenAI does not expose a version endpoint; `version` is always null.
 */
export async function checkOpenAIHealth(): Promise<ProviderHealthStatus> {
  let settings;
  try {
    settings = getOpenAISettings();
  } catch (err) {
    return {
      connected: false,
      version: null,
      models: [],
      error: err instanceof Error ? err.message : "Unknown configuration error",
    };
  }

  try {
    const response = await fetch(`${settings.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return {
        connected: false,
        version: null,
        models: [],
        error: `OpenAI API responded with ${response.status}.`,
      };
    }

    const { data } = (await response.json()) as OpenAIModelsResponse;

    const activeIds = new Set([
      ...OPENAI_CHAT_MODELS,
      ...OPENAI_EMBEDDING_MODELS,
    ]);

    // Show only the curated models that the key actually has access to
    const liveIds = new Set(data.map((m) => m.id));
    const relevant = [...activeIds]
      .filter((id) => liveIds.has(id))
      .sort()
      .map<ProviderModelInfo>((id) => ({
        name: id,
        size: null,
        modifiedAt: null,
      }));

    return {
      connected: true,
      version: null,
      models: relevant,
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      version: null,
      models: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

interface GroqModelsResponse {
  object: "list";
  data: Array<{ id: string; object: string }>;
}

/**
 * Checks whether the Groq API is reachable with the configured key and
 * returns the intersection of available models and the curated chat model list.
 */
export async function checkGroqHealth(): Promise<ProviderHealthStatus> {
  let settings;
  try {
    settings = getGroqSettings();
  } catch (err) {
    return {
      connected: false,
      version: null,
      models: [],
      error: err instanceof Error ? err.message : "Unknown configuration error",
    };
  }

  try {
    const response = await fetch(`${settings.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return {
        connected: false,
        version: null,
        models: [],
        error: `Groq API responded with ${response.status}.`,
      };
    }

    const { data } = (await response.json()) as GroqModelsResponse;

    const activeIds = new Set(GROQ_CHAT_MODELS);
    const liveIds = new Set(data.map((m) => m.id));
    const relevant = [...activeIds]
      .filter((id) => liveIds.has(id))
      .sort()
      .map<ProviderModelInfo>((id) => ({
        name: id,
        size: null,
        modifiedAt: null,
      }));

    return {
      connected: true,
      version: null,
      models: relevant,
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      version: null,
      models: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
