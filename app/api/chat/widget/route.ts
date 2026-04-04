/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 *
 * POST /api/chat/widget
 * Body: { message: string; history: Array<{role: "user"|"assistant"; content: string}> }
 * Response: text/event-stream
 *   data: {"type":"token","text":"…"}
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"…"}
 *   data: {"type":"action","name":"…","record":{…}}
 *
 * Mirrors the main chat stream route but without DB persistence.
 * Widget conversations live in the client's sessionStorage only — they are
 * not counted toward saved-chat limits.  All shared monthly quotas
 * (messages, tokens, tool calls) are enforced identically to main chat.
 * An additional daily widget-specific gate (enforceWidgetChats /
 * enforceWidgetTools) applies on top.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { streamChat } from "@/lib/llm-providers/provider";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import {
  enforceWidgetChats,
  enforceWidgetTools,
  enforceMonthlyLimits,
  accumulateTokens,
  enforceToolCallsMonthly,
} from "@/lib/tiers";
import { getUserPreferences } from "@/lib/settings/user-preferences.logic";
import { buildSystemPrompt } from "@/lib/context/build";
import { TOOL_REGISTRY } from "@/lib/tools/registry";
import { executeToolCall } from "@/lib/tools/executor";
import type { LLMMessage, LLMChatOptions, LLMToolCall } from "@/types/llm";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting — shared limiter with main chat
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
    history?: unknown;
  };

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const userMessage = body.message.trim();

  // Validate and sanitise the history array sent from the client
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history: Array<{ role: "user" | "assistant"; content: string }> = (
    rawHistory as unknown[]
  )
    .filter(
      (h): h is { role: "user" | "assistant"; content: string } =>
        typeof h === "object" &&
        h !== null &&
        ((h as Record<string, unknown>).role === "user" ||
          (h as Record<string, unknown>).role === "assistant") &&
        typeof (h as Record<string, unknown>).content === "string",
    )
    // Cap history depth to avoid runaway context
    .slice(-40);

  // Widget-specific daily gate
  const widgetCheck = await enforceWidgetChats(session.user.id);
  if (!widgetCheck.allowed) {
    return NextResponse.json({ error: widgetCheck.reason }, { status: 429 });
  }

  // Shared monthly message + token budget (same pool as main chat)
  const monthlyCheck = await enforceMonthlyLimits(session.user.id);
  if (!monthlyCheck.allowed) {
    return NextResponse.json({ error: monthlyCheck.reason }, { status: 429 });
  }

  const prefs = await getUserPreferences(session.user.id);

  const systemMessage = await buildSystemPrompt(session.user.id, userMessage, {
    language: prefs.language,
  });

  const llmMessages: LLMMessage[] = [
    systemMessage,
    ...history,
    { role: "user" as const, content: userMessage },
  ];

  const chatOptions: LLMChatOptions = {
    tools: TOOL_REGISTRY,
  };

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
        if (toolCalls.length > 0) {
          // Widget-specific daily tool gate
          const widgetToolCheck = await enforceWidgetTools(
            session.user.id,
            toolCalls.length,
          );
          if (!widgetToolCheck.allowed) {
            send({
              type: "error",
              message: widgetToolCheck.reason ?? "Tool call limit reached.",
            });
            return;
          }

          // Shared monthly tool budget
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

          followUp.push({
            role: "assistant",
            content: null,
            tool_calls: toolCalls,
          });

          for (const toolCall of toolCalls) {
            const result = await executeToolCall(session.user.id, toolCall);
            const resultContent = result.ok
              ? JSON.stringify(result.data)
              : `Error: ${result.error}`;
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
