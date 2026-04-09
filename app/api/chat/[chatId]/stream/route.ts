/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * POST /api/chat/[chatId]/stream
 * Body: { message: string }
 * Response: text/event-stream
 *   data: {"type":"token","text":"…"}
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"…"}
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getChatMessages,
  saveUserMessage,
  saveAssistantMessage,
  touchChat,
  setInitialTitle,
} from "@/lib/chat";
import { streamChat } from "@/lib/llm-providers";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import {
  enforceMonthlyLimits,
  accumulateTokens,
  enforceToolCallsMonthly,
} from "@/lib/tiers";
import { getUserPreferences } from "@/lib/settings";
import { buildSystemPrompt } from "@/lib/context/build";
import { getActiveToolsForUser, executeToolCall } from "@/lib/tools";
import type { LLMMessage, LLMChatOptions, LLMToolCall } from "@/types/llm";

type Params = { params: Promise<{ chatId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = chatRateLimiter.check(identifier);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many messages. Please wait ${rateLimit.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = (await req.json()) as {
    message?: unknown;
    temperature?: unknown;
    timeoutMs?: unknown;
  };

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const userMessage = body.message.trim();

  const { chatId } = await params;

  // Verify ownership and load history
  const chatData = await getChatMessages(chatId, session.user.id);

  if (!chatData) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // Enforce monthly message + token budget before touching the LLM
  const monthlyCheck = await enforceMonthlyLimits(session.user.id);
  if (!monthlyCheck.allowed) {
    return NextResponse.json({ error: monthlyCheck.reason }, { status: 429 });
  }

  // Persist user message immediately
  await saveUserMessage(chatId, userMessage);

  // Auto-title on first message
  if (chatData.messages.length === 0) {
    await setInitialTitle(chatId, userMessage);
  }

  // Build message array for LLM
  const [prefs, activeTools] = await Promise.all([
    getUserPreferences(session.user.id),
    getActiveToolsForUser(session.user.id),
  ]);

  const systemMessage = await buildSystemPrompt(session.user.id, userMessage, {
    language: prefs.language,
    tools: activeTools,
  });

  const chatOptions: LLMChatOptions = {
    ...(typeof body.temperature === "number" && {
      temperature: Math.min(2, Math.max(0, body.temperature)),
    }),
    ...(typeof body.timeoutMs === "number" && {
      timeoutMs: Math.min(120_000, Math.max(5_000, body.timeoutMs)),
    }),
    tools: activeTools,
  };

  const llmMessages: LLMMessage[] = [
    systemMessage,
    ...chatData.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  // Stream response as SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      let assistantContent = "";
      let toolCallChars = 0;

      try {
        const toolCalls: LLMToolCall[] = [];

        // First LLM pass — collect tokens and any tool call requests
        for await (const chunk of streamChat(llmMessages, chatOptions)) {
          if (typeof chunk === "string") {
            send({ type: "token", text: chunk });
            assistantContent += chunk;
          } else {
            toolCalls.push(chunk);
          }
        }

        // If the LLM requested tool calls, execute them and do a second pass
        // so the LLM can produce a text response after seeing the results.
        if (toolCalls.length > 0) {
          // Gate on monthly tool call budget before executing
          const toolCheck = await enforceToolCallsMonthly(
            session.user.id,
            toolCalls.length,
          );
          if (!toolCheck.allowed) {
            send({
              type: "error",
              message: toolCheck.reason ?? "Tool call limit reached.",
            });
            return;
          }

          const followUp: LLMMessage[] = [...llmMessages];

          // Append the assistant's tool_calls turn (OpenAI requires this in history)
          followUp.push({
            role: "assistant",
            content: null,
            tool_calls: toolCalls,
          });

          // Execute each tool, emit the action event, append the tool result
          for (const toolCall of toolCalls) {
            const result = await executeToolCall(session.user.id, toolCall);
            const resultContent = result.ok
              ? JSON.stringify(result.data)
              : `Error: ${result.error}`;
            // Accumulate chars for approximate token accounting
            toolCallChars +=
              (toolCall.function.arguments?.length ?? 0) + resultContent.length;
            send({
              type: "action",
              name: toolCall.function.name,
              record: result.ok ? (result.data as Record<string, unknown>) : {},
            });
            followUp.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: resultContent,
            });
          }

          // Second LLM pass — no tools to avoid infinite loops
          const { tools: _tools, ...baseOptions } = chatOptions;
          for await (const chunk of streamChat(followUp, baseOptions)) {
            if (typeof chunk === "string") {
              send({ type: "token", text: chunk });
              assistantContent += chunk;
            }
          }
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream error",
        });
      } finally {
        if (assistantContent) {
          await saveAssistantMessage(chatId, assistantContent);
          await touchChat(chatId);
          // Fire-and-forget — non-critical, must not block the response
          accumulateTokens(
            session.user.id,
            userMessage.length,
            assistantContent.length,
            toolCallChars,
          ).catch(() => {});
        }
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
