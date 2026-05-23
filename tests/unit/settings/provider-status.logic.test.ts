import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderHealthStatus } from "@/types/llm";

const health: ProviderHealthStatus = {
  connected: true,
  version: "1.0.0",
  models: [],
  error: null,
};

const mocks = vi.hoisted(() => ({
  checkGroqHealth: vi.fn<() => Promise<ProviderHealthStatus>>(),
  checkOllamaHealth: vi.fn<() => Promise<ProviderHealthStatus>>(),
  checkOpenAIHealth: vi.fn<() => Promise<ProviderHealthStatus>>(),
}));

vi.mock("@/lib/ai/llm-providers/shared/provider-health", () => ({
  checkGroqHealth: mocks.checkGroqHealth,
  checkOllamaHealth: mocks.checkOllamaHealth,
  checkOpenAIHealth: mocks.checkOpenAIHealth,
}));

import { getProviderStatus } from "@/lib/platform/settings/provider-status.logic";

const originalChatProvider = process.env.CHAT_PROVIDER;
const originalGroqModel = process.env.GROQ_MODEL;

describe("getProviderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkGroqHealth.mockResolvedValue(health);
    mocks.checkOllamaHealth.mockResolvedValue({
      ...health,
      connected: false,
      error: "offline",
    });
    mocks.checkOpenAIHealth.mockResolvedValue(health);
    process.env.CHAT_PROVIDER = "groq";
    process.env.GROQ_MODEL = "llama-test";
  });

  afterEach(() => {
    if (originalChatProvider === undefined) {
      delete process.env.CHAT_PROVIDER;
    } else {
      process.env.CHAT_PROVIDER = originalChatProvider;
    }
    if (originalGroqModel === undefined) {
      delete process.env.GROQ_MODEL;
    } else {
      process.env.GROQ_MODEL = originalGroqModel;
    }
  });

  it("returns active provider status and configured active model", async () => {
    const result = await getProviderStatus();

    expect(result.active).toBe("groq");
    expect(result.activeModel).toBe("llama-test");
    expect(result.providers).toHaveLength(3);
    expect(result.providers.map((p) => p.provider)).toEqual([
      "openAi",
      "ollama",
      "groq",
    ]);
  });

  it("falls back to OpenAI when CHAT_PROVIDER is invalid", async () => {
    process.env.CHAT_PROVIDER = "unknown";

    const result = await getProviderStatus();

    expect(result.active).toBe("openAi");
    expect(result.activeModel).toBe("gpt-4o-mini");
  });
});
