import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenAISettings } from "@/lib/ai/llm-providers/openai/openai-settings";

const fetchMock = vi.fn<typeof fetch>();

const settings: OpenAISettings = {
  apiKey: "openai-key",
  baseUrl: "https://api.openai.test/v1",
  chatModel: "gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
  maxTokens: 4096,
  temperature: 0.7,
  timeoutMs: 30000,
};

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  enforceVoiceRequests: vi.fn<
    (userId: string) => Promise<{ allowed: boolean; reason?: string }>
  >(),
  getOpenAISettings: vi.fn<() => OpenAISettings>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  recordVoiceDuration: vi.fn<(userId: string, seconds: number) => Promise<void>>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/platform/tiers", () => ({
  enforceVoiceRequests: mocks.enforceVoiceRequests,
  recordVoiceDuration: mocks.recordVoiceDuration,
}));

vi.mock("@/lib/ai/llm-providers/openai/openai-settings", () => ({
  getOpenAISettings: mocks.getOpenAISettings,
}));

import { POST } from "@/app/api/chat/transcribe/route";

describe("/api/chat/transcribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.enforceVoiceRequests.mockResolvedValue({ allowed: true });
    mocks.getOpenAISettings.mockReturnValue(settings);
    mocks.recordVoiceDuration.mockResolvedValue();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ text: "  Hello world.  ", duration: 61 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/chat/transcribe", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(mocks.enforceVoiceRequests).not.toHaveBeenCalled();
  });

  it("returns 403 when the voice quota is exhausted", async () => {
    mocks.enforceVoiceRequests.mockResolvedValueOnce({
      allowed: false,
      reason: "Voice limit reached.",
    });

    const response = await POST(
      new Request("http://localhost/api/chat/transcribe", { method: "POST" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Voice limit reached.",
    });
  });

  it("returns 400 when the audio field is missing", async () => {
    const form = new FormData();

    const response = await POST(
      new Request("http://localhost/api/chat/transcribe", {
        body: form,
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing or invalid audio field",
    });
  });

  it("transcribes audio through OpenAI and records returned duration", async () => {
    const form = new FormData();
    form.append(
      "audio",
      new Blob(["audio-bytes"], { type: "audio/webm;codecs=opus" }),
    );
    form.append("durationMs", "120000");

    const response = await POST(
      new Request("http://localhost/api/chat/transcribe", {
        body: form,
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ text: "Hello world." });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.test/v1/audio/transcriptions",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer openai-key" },
      }),
    );
    expect(mocks.recordVoiceDuration).toHaveBeenCalledWith("user-1", 61);
  });
});
