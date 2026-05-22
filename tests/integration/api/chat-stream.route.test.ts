import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  buildSystemPrompt: vi.fn(),
  chatRateLimitCheck: vi.fn<
    (identifier: string) => Promise<{ allowed: boolean; retryAfterSeconds: number }>
  >(),
  classifyMessage: vi.fn<() => Promise<string[]>>(),
  createReport: vi.fn<() => Promise<unknown>>(),
  enforceMonthlyLimits: vi.fn<
    (userId: string) => Promise<{ allowed: boolean; reason?: string }>
  >(),
  enforceToolCallsMonthly: vi.fn(),
  executeToolCall: vi.fn(),
  getActiveToolsForUser: vi.fn<() => Promise<unknown[]>>(),
  getChatMessages: vi.fn(),
  getRateLimitIdentifier: vi.fn<(req: Request, fallback: string) => string>(),
  getSession: vi.fn<GetSession>(),
  getUserPreferences: vi.fn<() => Promise<{ language: "en"; reportsEnabled: true }>>(),
  getUserTier: vi.fn<() => Promise<"pro">>(),
  headers: vi.fn<HeadersProvider>(),
  runAgent: vi.fn(),
  saveAssistantMessage: vi.fn<() => Promise<unknown>>(),
  saveUserMessage: vi.fn<() => Promise<unknown>>(),
  setInitialTitle: vi.fn<() => Promise<unknown>>(),
  streamChat: vi.fn(),
  touchChat: vi.fn<() => Promise<unknown>>(),
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

vi.mock("@/lib/core/security", () => ({
  chatRateLimiter: {
    check: mocks.chatRateLimitCheck,
  },
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
}));

vi.mock("@/lib/features/chat", () => ({
  getChatMessages: mocks.getChatMessages,
  saveAssistantMessage: mocks.saveAssistantMessage,
  saveUserMessage: mocks.saveUserMessage,
  setInitialTitle: mocks.setInitialTitle,
  touchChat: mocks.touchChat,
}));

vi.mock("@/lib/ai/llm-providers", () => ({
  streamChat: mocks.streamChat,
}));

vi.mock("@/lib/platform/tiers", () => ({
  accumulateTokens: mocks.accumulateTokens,
  enforceMonthlyLimits: mocks.enforceMonthlyLimits,
  enforceToolCallsMonthly: mocks.enforceToolCallsMonthly,
  getUserTier: mocks.getUserTier,
}));

vi.mock("@/lib/platform/settings", () => ({
  getUserPreferences: mocks.getUserPreferences,
}));

vi.mock("@/lib/ai/context/build", () => ({
  buildSystemPrompt: mocks.buildSystemPrompt,
}));

vi.mock("@/lib/ai/tools", () => ({
  executeToolCall: mocks.executeToolCall,
  getActiveToolsForUser: mocks.getActiveToolsForUser,
}));

vi.mock("@/lib/features/reports", () => ({
  createReport: mocks.createReport,
}));

vi.mock("@/lib/ai/agents/classify", () => ({
  classifyMessage: mocks.classifyMessage,
}));

vi.mock("@/lib/ai/agents/registry", () => ({
  runAgent: mocks.runAgent,
}));

import { POST } from "@/app/api/chat/[chatId]/stream/route";

function params(chatId = "chat-1") {
  return { params: Promise.resolve({ chatId }) };
}

describe("/api/chat/[chatId]/stream route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.chatRateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getChatMessages.mockResolvedValue({
      chat: { id: "chat-1", title: "Board planning" },
      messages: [],
    });
    mocks.enforceMonthlyLimits.mockResolvedValue({ allowed: true });
    mocks.getUserPreferences.mockResolvedValue({
      language: "en",
      reportsEnabled: true,
    });
    mocks.getActiveToolsForUser.mockResolvedValue([]);
    mocks.getUserTier.mockResolvedValue("pro");
    mocks.classifyMessage.mockResolvedValue([]);
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(401);
    expect(mocks.chatRateLimitCheck).not.toHaveBeenCalled();
  });

  it("returns 429 when the chat rate limit is hit", async () => {
    mocks.chatRateLimitCheck.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 20,
    });

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("20");
  });

  it("returns 400 for invalid messages", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        body: JSON.stringify({ message: "   " }),
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid message",
    });
    expect(mocks.getChatMessages).not.toHaveBeenCalled();
  });

  it("returns 404 when the chat is missing or unowned", async () => {
    mocks.getChatMessages.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        body: JSON.stringify({ message: "Hello" }),
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Chat not found",
    });
  });

  it("returns 429 when monthly limits block the message", async () => {
    mocks.enforceMonthlyLimits.mockResolvedValueOnce({
      allowed: false,
      reason: "Monthly limit reached.",
    });

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        body: JSON.stringify({ message: "Hello" }),
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Monthly limit reached.",
    });
    expect(mocks.saveUserMessage).not.toHaveBeenCalled();
  });
});
