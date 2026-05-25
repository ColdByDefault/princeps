import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";
import type { SkillRecord } from "@/types/api";

const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  buildSystemPrompt: vi.fn(),
  chatRateLimitCheck:
    vi.fn<
      (
        identifier: string,
      ) => Promise<{ allowed: boolean; retryAfterSeconds: number }>
    >(),
  classifyMessage: vi.fn<() => Promise<string[]>>(),
  createReport: vi.fn<() => Promise<unknown>>(),
  enforceMonthlyLimits:
    vi.fn<(userId: string) => Promise<{ allowed: boolean; reason?: string }>>(),
  enforceToolCallsMonthly: vi.fn(),
  executeToolCall: vi.fn(),
  getActiveToolsForUser: vi.fn<() => Promise<unknown[]>>(),
  getChatMessages: vi.fn(),
  getSkillById: vi.fn<() => Promise<SkillRecord | null>>(),
  getRateLimitIdentifier: vi.fn<(req: Request, fallback: string) => string>(),
  getSession: vi.fn<GetSession>(),
  getUserPreferences:
    vi.fn<() => Promise<{ language: "en"; reportsEnabled: true }>>(),
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

vi.mock("@/lib/features/skills", () => ({
  getSkillById: mocks.getSkillById,
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

function parseSseEvents(payload: string): Array<Record<string, unknown>> {
  return payload
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.startsWith("data: "))
    .map((chunk) => JSON.parse(chunk.slice(6)) as Record<string, unknown>);
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
      chat: { id: "chat-1", title: "Board planning", activeSkillId: null },
      messages: [],
    });
    mocks.getSkillById.mockResolvedValue(null);
    mocks.enforceMonthlyLimits.mockResolvedValue({ allowed: true });
    mocks.enforceToolCallsMonthly.mockResolvedValue({ allowed: true });
    mocks.getUserPreferences.mockResolvedValue({
      language: "en",
      reportsEnabled: true,
    });
    mocks.accumulateTokens.mockResolvedValue();
    mocks.createReport.mockResolvedValue({ id: "report-1" });
    mocks.buildSystemPrompt.mockResolvedValue({
      role: "system",
      content: "You are Princeps.",
    });
    mocks.getActiveToolsForUser.mockResolvedValue([]);
    mocks.getUserTier.mockResolvedValue("pro");
    mocks.classifyMessage.mockResolvedValue([]);
    mocks.runAgent.mockResolvedValue({ ok: true, summary: "" });
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

  it("redacts stream errors in SSE events", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mocks.streamChat.mockImplementationOnce(async function* () {
      throw new Error("provider api key leaked: sk-very-secret");
    });

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        body: JSON.stringify({ message: "Hello" }),
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    const payload = await response.text();
    const events = parseSseEvents(payload);

    expect(events).toContainEqual({ type: "error", message: "Stream error" });
    expect(payload).not.toContain("sk-very-secret");
    expect(consoleError).toHaveBeenCalledWith("[chat/stream] stream failed", {
      errorName: "Error",
    });
    consoleError.mockRestore();
  });

  it("intersects runtime tools with active skill scope and enforces scoped execution", async () => {
    mocks.getChatMessages.mockResolvedValueOnce({
      chat: {
        id: "chat-1",
        title: "Board planning",
        activeSkillId: "skill-1",
      },
      messages: [],
    });

    mocks.getSkillById.mockResolvedValueOnce({
      id: "skill-1",
      name: "Board Operator",
      description: "Operate only board-related task tooling.",
      instructionsMarkdown: "Always structure board actions clearly.",
      allowedTools: ["create_task"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mocks.getActiveToolsForUser.mockResolvedValueOnce([
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Create task",
          parameters: {},
        },
      },
      {
        type: "function",
        function: {
          name: "delete_task",
          description: "Delete task",
          parameters: {},
        },
      },
    ]);

    mocks.classifyMessage.mockResolvedValueOnce(["task-extractor"]);
    mocks.runAgent.mockResolvedValueOnce({ ok: true, summary: "" });
    mocks.executeToolCall.mockResolvedValueOnce({
      ok: true,
      data: { id: "t-1" },
    });

    let round = 0;
    mocks.streamChat.mockImplementation(async function* () {
      round += 1;

      if (round === 1) {
        yield {
          id: "tc-1",
          type: "function",
          function: {
            name: "create_task",
            arguments: JSON.stringify({ title: "Prep board deck" }),
          },
        };
        return;
      }

      yield "Done.";
    });

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        body: JSON.stringify({ message: "Prepare board tasks" }),
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await response.text();

    expect(mocks.getSkillById).toHaveBeenCalledWith("user-1", "skill-1");

    const buildOpts = mocks.buildSystemPrompt.mock.calls[0]?.[2] as {
      language: string;
      tools?: Array<{ function: { name: string } }>;
    };
    expect(buildOpts.language).toBe("en");
    expect(buildOpts.tools?.map((tool) => tool.function.name)).toEqual([
      "create_task",
    ]);

    expect(mocks.runAgent).toHaveBeenCalledWith(
      "task-extractor",
      { userId: "user-1", userMessage: "Prepare board tasks" },
      { allowedToolNames: ["create_task"] },
    );

    expect(mocks.executeToolCall).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        function: expect.objectContaining({ name: "create_task" }),
      }),
      { allowedToolNames: ["create_task"] },
    );
  });

  it("appends active skill instructions as a secondary system layer", async () => {
    mocks.getChatMessages.mockResolvedValueOnce({
      chat: {
        id: "chat-1",
        title: "Board planning",
        activeSkillId: "skill-1",
      },
      messages: [],
    });

    mocks.getSkillById.mockResolvedValueOnce({
      id: "skill-1",
      name: "Board Operator",
      description: "Operate only board-related task tooling.",
      instructionsMarkdown: "Use concise markdown bullets.",
      allowedTools: ["create_task"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mocks.streamChat.mockImplementationOnce(async function* () {
      yield "Acknowledged.";
    });

    const response = await POST(
      new Request("http://localhost/api/chat/chat-1/stream", {
        body: JSON.stringify({ message: "Summarize board actions" }),
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await response.text();

    const firstCallMessages = mocks.streamChat.mock.calls[0]?.[0] as Array<{
      role: string;
      content: string | null;
    }>;
    const system = firstCallMessages[0];

    expect(system.role).toBe("system");
    expect(system.content).toContain(
      "## Active Skill (Secondary Instruction Layer)",
    );
    expect(system.content).toContain("Skill: Board Operator");
    expect(system.content).toContain("Use concise markdown bullets.");
  });
});
