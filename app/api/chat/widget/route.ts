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
import { streamChat } from "@/lib/llm-providers";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import {
  enforceWidgetChats,
  enforceWidgetTools,
  enforceMonthlyLimits,
  accumulateTokens,
  enforceToolCallsMonthly,
} from "@/lib/tiers";
import { getUserPreferences } from "@/lib/settings";
import { buildSystemPrompt } from "@/lib/context/build";
import { TOOL_REGISTRY, executeToolCall } from "@/lib/tools";
import { createReport } from "@/lib/reports";
import type { LLMMessage, LLMChatOptions, LLMToolCall } from "@/types/llm";
import type { ReportDetailCall } from "@/lib/reports";

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
      const reportDetails: ReportDetailCall[] = [];

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

          let allToolsSucceeded = true;
          for (const toolCall of toolCalls) {
            const result = await executeToolCall(session.user.id, toolCall);
            if (!result.ok) allToolsSucceeded = false;
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
            reportDetails.push(
              buildDetailCall(
                toolCall.function.name,
                toolCall.function.arguments,
                result,
              ),
            );
            followUp.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: resultContent,
            });
          }

          // Read tools (list_*, get_*) need a second LLM pass to surface results.
          // Write tools that all succeeded can skip it and just reply "Done".
          const hasReadTool = toolCalls.some(
            (tc) =>
              tc.function.name.startsWith("list_") ||
              tc.function.name.startsWith("get_"),
          );

          if (allToolsSucceeded && !hasReadTool) {
            // All write tools succeeded — skip second LLM pass and reply with "Done"
            send({ type: "token", text: "Done" });
            assistantContent = "Done";
          } else {
            // Read tool present, or at least one tool failed — let the LLM respond
            const { tools: _tools, ...baseOptions } = chatOptions;
            for await (const chunk of streamChat(followUp, baseOptions)) {
              if (typeof chunk === "string") {
                send({ type: "token", text: chunk });
                assistantContent += chunk;
              }
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
          // Create report if tools were called and user has reports enabled
          if (reportDetails.length > 0 && prefs.reportsEnabled !== false) {
            const approxTokens = Math.ceil(
              (userMessage.length + assistantContent.length + toolCallChars) /
                4,
            );
            createReport(session.user.id, {
              toolsCalled: reportDetails.map((d) => d.tool),
              toolCallCount: reportDetails.length,
              tokenUsage: approxTokens,
              details: reportDetails,
            }).catch(() => {});
          }
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

// ─── Helpers ──────────────────────────────────────────────

function buildDetailCall(
  toolName: string,
  rawArgs: string,
  result: { ok: boolean; data?: unknown; error?: string },
): ReportDetailCall {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(rawArgs) as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  const kv: Record<string, unknown> = {};

  if (!result.ok) {
    kv["err"] = result.error ?? "unknown";
    return { tool: toolName, ok: false, kv };
  }

  const data = result.data as Record<string, unknown> | null | undefined;

  if (typeof args["title"] === "string") kv["title"] = args["title"];
  else if (typeof data?.["title"] === "string") kv["title"] = data["title"];

  if (typeof args["name"] === "string") kv["name"] = args["name"];
  else if (typeof data?.["name"] === "string") kv["name"] = data["name"];

  if (typeof data?.["id"] === "string") kv["id"] = data["id"];

  if (typeof args["status"] === "string") kv["status"] = args["status"];
  else if (typeof data?.["status"] === "string") kv["status"] = data["status"];

  if (typeof args["priority"] === "string") kv["priority"] = args["priority"];

  if (typeof args["meetingId"] === "string")
    kv["meetingId"] = args["meetingId"];
  else if (typeof data?.["meetingId"] === "string")
    kv["meetingId"] = data["meetingId"];

  if (Array.isArray(data?.["contacts"]))
    kv["contacts"] = (data["contacts"] as unknown[]).length;
  if (Array.isArray(data?.["labels"]))
    kv["labels"] = (data["labels"] as unknown[]).length;

  if (Array.isArray(data)) kv["count"] = data.length;

  return { tool: toolName, ok: true, kv };
}
