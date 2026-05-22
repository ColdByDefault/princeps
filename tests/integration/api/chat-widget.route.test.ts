import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  buildSystemPrompt: vi.fn(),
  chatRateLimitCheck: vi.fn<
    (identifier: string) => Promise<{ allowed: boolean; retryAfterSeconds: number }>
  >(),
  createReport: vi.fn<() => Promise<unknown>>(),
  enforceMonthlyLimits: vi.fn<
    (userId: string) => Promise<{ allowed: boolean; reason?: string }>
  >(),
  enforceToolCallsMonthly: vi.fn(),
  enforceWidgetChats: vi.fn<
    (userId: string) => Promise<{ allowed: boolean; reason?: string }>
  >(),
  enforceWidgetTools: vi.fn(),
  executeToolCall: vi.fn(),
  getActiveToolsForUser: vi.fn<() => Promise<unknown[]>>(),
  getRateLimitIdentifier: vi.fn<(req: Request, fallback: string) => string>(),
  getSession: vi.fn<GetSession>(),
  getUserPreferences: vi.fn<() => Promise<{ language: "en"; reportsEnabled: true }>>(),
  headers: vi.fn<HeadersProvider>(),
  streamChat: vi.fn(),
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

vi.mock("@/lib/ai/llm-providers", () => ({
  streamChat: mocks.streamChat,
}));

vi.mock("@/lib/platform/tiers", () => ({
  accumulateTokens: mocks.accumulateTokens,
  enforceMonthlyLimits: mocks.enforceMonthlyLimits,
  enforceToolCallsMonthly: mocks.enforceToolCallsMonthly,
  enforceWidgetChats: mocks.enforceWidgetChats,
  enforceWidgetTools: mocks.enforceWidgetTools,
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

import { POST } from "@/app/api/chat/widget/route";

describe("/api/chat/widget route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.chatRateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.enforceWidgetChats.mockResolvedValue({ allowed: true });
    mocks.enforceMonthlyLimits.mockResolvedValue({ allowed: true });
    mocks.getUserPreferences.mockResolvedValue({
      language: "en",
      reportsEnabled: true,
    });
    mocks.getActiveToolsForUser.mockResolvedValue([]);
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/chat/widget", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(mocks.chatRateLimitCheck).not.toHaveBeenCalled();
  });

  it("returns 429 when the chat rate limit is hit", async () => {
    mocks.chatRateLimitCheck.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 15,
    });

    const response = await POST(
      new Request("http://localhost/api/chat/widget", { method: "POST" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("15");
  });

  it("returns 400 for invalid messages", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat/widget", {
        body: JSON.stringify({ message: "   " }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid message",
    });
    expect(mocks.enforceWidgetChats).not.toHaveBeenCalled();
  });

  it("returns 429 when widget daily limits block the message", async () => {
    mocks.enforceWidgetChats.mockResolvedValueOnce({
      allowed: false,
      reason: "Daily widget chat limit reached.",
    });

    const response = await POST(
      new Request("http://localhost/api/chat/widget", {
        body: JSON.stringify({ message: "Hello" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Daily widget chat limit reached.",
    });
  });

  it("returns 429 when monthly limits block the message", async () => {
    mocks.enforceMonthlyLimits.mockResolvedValueOnce({
      allowed: false,
      reason: "Monthly limit reached.",
    });

    const response = await POST(
      new Request("http://localhost/api/chat/widget", {
        body: JSON.stringify({ message: "Hello" }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Monthly limit reached.",
    });
    expect(mocks.getUserPreferences).not.toHaveBeenCalled();
  });
});
