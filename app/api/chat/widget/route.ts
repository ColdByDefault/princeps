/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/context/build";
import { callChat, streamChat } from "@/lib/chat/provider";
import { type OllamaMessage, type OllamaStreamChunk } from "@/lib/chat/ollama";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { CHAT_TOOLS, executeToolCall } from "@/lib/chat/tools";
import type { ActionResult } from "@/lib/chat/tools";
import { generateAndPushReport } from "@/lib/reports/generate.logic";
import {
  checkAndConsumeWidgetChat,
  incrementWidgetToolCounter,
} from "@/lib/billing/enforce.logic";

type HistoryEntry = { role: "user" | "assistant"; content: string };

// POST /api/chat/widget
// Stateless streaming endpoint for the floating chat widget.
// Does not persist messages — sends the full client-supplied history on each request.
// Body: { message: string; history?: HistoryEntry[] }
// Response: text/event-stream with SSE events:
//   data: {"type":"token","text":"…"}
//   data: {"type":"done"}
//   data: {"type":"error","message":"…"}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = chatRateLimiter.check(identifier);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  // Plan enforcement: check and consume the daily widget chat quota
  const widgetCheck = await checkAndConsumeWidgetChat(session.user.id);
  if (!widgetCheck.allowed) {
    return NextResponse.json(
      { error: "Daily widget chat limit reached for your plan." },
      { status: 429 },
    );
  }
  const remainingToolQuota = widgetCheck.remainingToolQuota;

  const body = (await req.json()) as {
    message?: unknown;
    history?: unknown;
  };

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const userMessage = body.message.trim();

  // Validate and sanitize history — silently drop malformed entries
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history: HistoryEntry[] = (rawHistory as unknown[])
    .filter((e): e is HistoryEntry => {
      if (e === null || typeof e !== "object") return false;
      const entry = e as Record<string, unknown>;
      return (
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        (entry.content as string).trim().length > 0
      );
    })
    .slice(-20); // cap at the last 20 turns

  const preferences = await getUserPreferences(session.user.id);

  const systemMessage = await buildSystemPrompt(session.user.id, userMessage, {
    assistantName: preferences.assistantName,
    systemPrompt: preferences.systemPrompt,
    responseStyle: preferences.responseStyle,
    language: preferences.language,
  });

  const ollamaMessages = [
    systemMessage,
    ...history,
    { role: "user" as const, content: userMessage },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        // ── Non-streaming call with tools ─────────────────────────────────────
        let firstResult;
        try {
          firstResult = await callChat(
            ollamaMessages,
            preferences.ollamaOptions,
            CHAT_TOOLS,
          );
        } catch {
          send({
            type: "error",
            message:
              "Assistant unavailable. Please check the provider configuration.",
          });
          return;
        }

        // Trim tool calls to the user's remaining daily tool quota
        const allowedToolCalls = firstResult.toolCalls.slice(
          0,
          remainingToolQuota,
        );

        if (allowedToolCalls.length > 0) {
          // ── Phase 2: execute tool calls ──────────────────────────────────────
          const toolResultMessages: OllamaMessage[] = [];
          const collectedActions: ActionResult[] = [];
          const assistantWithTools: OllamaMessage = {
            role: "assistant",
            content: firstResult.content,
            tool_calls: allowedToolCalls,
          };

          for (const toolCall of allowedToolCalls) {
            const { action, summary } = await executeToolCall(
              session.user.id,
              toolCall,
            );

            if (action) {
              collectedActions.push(action);
              send({
                type: "action",
                name: action.name,
                record: action.record,
              });
            }

            toolResultMessages.push({ role: "tool", content: summary });
          }

          // Increment tool counter (fire-and-forget)
          void incrementWidgetToolCounter(
            session.user.id,
            allowedToolCalls.length,
          ).catch(() => undefined);

          // Fire-and-forget: generate report + notification for this batch
          if (collectedActions.length > 0) {
            void generateAndPushReport({
              userId: session.user.id,
              userName: session.user.name ?? null,
              locale: preferences.language ?? "en",
              actions: collectedActions,
            });
          }

          // ── Phase 3: stream the follow-up reply ───────────────────────────
          const followUpMessages: OllamaMessage[] = [
            ...ollamaMessages,
            assistantWithTools,
            ...toolResultMessages,
          ];

          let followUpResponse: Response;
          try {
            followUpResponse = await streamChat(
              followUpMessages,
              false,
              preferences.ollamaOptions,
            );
          } catch {
            send({ type: "done" });
            controller.close();
            return;
          }

          const followUpBody = followUpResponse.body;
          if (followUpBody) {
            const reader = followUpBody.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  if (!line.trim()) continue;
                  let chunk: OllamaStreamChunk;
                  try {
                    chunk = JSON.parse(line) as OllamaStreamChunk;
                  } catch {
                    continue;
                  }
                  if (chunk.message?.content) {
                    send({ type: "token", text: chunk.message.content });
                  }
                  if (chunk.done) break;
                }
              }
            } finally {
              reader.releaseLock();
            }
          }
        } else {
          // ── No tool calls: send result from non-streaming call ────────────
          if (firstResult.content) {
            send({ type: "token", text: firstResult.content });
          }
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream error",
        });
      } finally {
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
