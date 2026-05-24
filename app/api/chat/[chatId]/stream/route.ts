/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth/auth";
import {
  getChatMessages,
  saveUserMessage,
  saveAssistantMessage,
  touchChat,
  setInitialTitle,
} from "@/lib/features/chat";
import { streamChat } from "@/lib/ai/llm-providers";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/core/security";
import {
  enforceMonthlyLimits,
  accumulateTokens,
  enforceToolCallsMonthly,
  getUserTier,
} from "@/lib/platform/tiers";
import { getUserPreferences } from "@/lib/platform/settings";
import { buildSystemPrompt } from "@/lib/ai/context/build";
import { getActiveToolsForUser, executeToolCall } from "@/lib/ai/tools";
import { createReport } from "@/lib/features/reports";
import { classifyMessage } from "@/lib/ai/agents/classify";
import { runAgent } from "@/lib/ai/agents/registry";
import type { LLMMessage, LLMChatOptions, LLMToolCall } from "@/types/llm";
import type { ReportDetailCall } from "@/lib/features/reports";

type Params = { params: Promise<{ chatId: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = await chatRateLimiter.check(identifier);

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
  const [prefs, activeTools, userTier] = await Promise.all([
    getUserPreferences(session.user.id),
    getActiveToolsForUser(session.user.id),
    getUserTier(session.user.id),
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

  // ── Sub-agent pre-pass ──────────────────────────────────
  // Classify the message and run matched agents before streaming.
  // Results are injected as a synthetic assistant turn so the main LLM
  // can reference completed work without streaming it to the user.
  // Agent tool calls are seeded into reportDetails so they appear in reports.
  const reportDetails: ReportDetailCall[] = [];
  // Collected for UI events emitted at stream start so clients can show which agents ran.
  const agentRunSummary: { name: string; ok: boolean }[] = [];

  const agentNames = await classifyMessage(userMessage, userTier);
  if (agentNames.length > 0) {
    const agentResults = await Promise.all(
      agentNames.map((name) =>
        runAgent(name, { userId: session.user.id, userMessage }),
      ),
    );

    // Collect run summary for UI events
    for (let i = 0; i < agentNames.length; i++) {
      agentRunSummary.push({ name: agentNames[i], ok: agentResults[i].ok });
    }

    // Seed reportDetails with every tool call the agents performed
    for (const agentResult of agentResults) {
      if (agentResult.agentCalls) {
        for (const call of agentResult.agentCalls) {
          reportDetails.push(
            buildDetailCall(call.toolName, call.args, call.result),
          );
        }
      }
    }

    const summaries = agentResults
      .filter((r) => r.ok && r.summary)
      .map((r) => r.summary)
      .join("\n\n");
    if (summaries) {
      // Insert before the final user message so the main LLM sees the results naturally
      llmMessages.splice(llmMessages.length - 1, 0, {
        role: "assistant",
        content: summaries,
      });
    }
  }

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
      // reportDetails is declared above and pre-seeded with any agent tool calls

      // Emit agent pre-pass events so the client can show which agents ran
      for (const agentRun of agentRunSummary) {
        send({ type: "agent", name: agentRun.name, ok: agentRun.ok });
      }

      try {
        // Multi-round tool calling before the final text-only response pass.
        // Meeting recaps can need several dependent rounds: read existing
        // records, create missing contacts, create/link meetings, then attach
        // decisions, goals, and prep tasks using returned IDs.
        const MAX_TOOL_ROUNDS = 12;
        const conversationMessages: LLMMessage[] = [...llmMessages];
        let toolRound = 0;

        while (toolRound <= MAX_TOOL_ROUNDS) {
          const toolCalls: LLMToolCall[] = [];
          // Final pass strips tools so the LLM is forced to produce a text response.
          const isLastRound = toolRound === MAX_TOOL_ROUNDS;
          const { tools: _noTools, ...baseOptions } = chatOptions;
          const passOptions: LLMChatOptions = isLastRound
            ? baseOptions
            : chatOptions;

          for await (const chunk of streamChat(
            conversationMessages,
            passOptions,
          )) {
            if (typeof chunk === "string") {
              send({ type: "token", text: chunk });
              assistantContent += chunk;
            } else {
              toolCalls.push(chunk);
            }
          }

          // No tool calls — LLM is done (produced a text response).
          if (toolCalls.length === 0) break;

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

          // Append the assistant's tool_calls turn (OpenAI requires this in history)
          conversationMessages.push({
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
            conversationMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: resultContent,
            });
          }

          toolRound++;
        }
      } catch (err) {
        const errorName = err instanceof Error ? err.name : "UnknownError";
        console.error("[chat/stream] stream failed", { errorName });
        send({
          type: "error",
          message: "Stream error",
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

/**
 * Builds a compact key-value detail entry for a single tool call.
 * Uses args and result data to extract only the most useful identifiers.
 * Intentionally keeps data minimal to avoid storing PII-heavy blobs.
 */
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

  // Extract compact identifiers from args or result
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
  if (Array.isArray(data?.["labels"])) {
    const labelNames = (data["labels"] as Array<Record<string, unknown>>)
      .map((l) => (typeof l["name"] === "string" ? l["name"] : null))
      .filter(Boolean);
    kv["labels"] = labelNames.length > 0 ? labelNames.join(", ") : 0;
  }

  // Count from list results
  if (Array.isArray(data)) kv["count"] = data.length;

  return { tool: toolName, ok: true, kv };
}
