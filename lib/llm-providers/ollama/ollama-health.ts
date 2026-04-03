/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { getOllamaSettings } from "./ollama-settings";

// ─── Public Types ─────────────────────────────────────────

export interface OllamaModelInfo {
  name: string;
  /** Model size in bytes. */
  size: number;
  modifiedAt: string;
}

export interface OllamaHealthStatus {
  connected: boolean;
  version: string | null;
  /** All models currently available in this Ollama instance. */
  models: OllamaModelInfo[];
  error: string | null;
}

// ─── Internal API Shapes ──────────────────────────────────

interface OllamaVersionResponse {
  version: string;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    size: number;
    modified_at: string;
  }>;
}

// ─── Health Check ─────────────────────────────────────────

/**
 * Checks whether the Ollama server is reachable and returns its version and
 * the list of locally available models.
 *
 * Always resolves — never throws. Errors are captured in `result.error`.
 * Suitable for health-check API routes and admin status dashboards.
 */
export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
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
    return {
      connected: false,
      version: null,
      models: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
