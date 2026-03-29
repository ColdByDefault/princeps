/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/context/build";
import {
  streamOllamaChat,
  type OllamaMessage,
  type OllamaStreamChunk,
  type OllamaToolCallEntry,
} from "@/lib/chat/ollama";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { CHAT_TOOLS, executeToolCall } from "@/lib/chat/tools";

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
  });

  const ollamaMessages = [
    systemMessage,
    ...history,
    { role: "user" as const, content: userMessage },
  ];

  let ollamaResponse: Response;

  try {
    ollamaResponse = await streamOllamaChat(
      ollamaMessages,
      false,
      preferences.ollamaOptions,
      CHAT_TOOLS,
    );
  } catch {
    return NextResponse.json(
      { error: "Assistant unavailable. Is Ollama running?" },
      { status: 502 },
    );
  }

  const ollamaBody = ollamaResponse.body;

  if (!ollamaBody) {
    return NextResponse.json(
      { error: "Empty response from Ollama" },
      { status: 502 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      // ── Helper: drain a non-token stream pass ─────────────────────────────
      async function drainBody(body: ReadableStream<Uint8Array>) {
        const r = body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let content = "";
        let toolCalls: OllamaToolCallEntry[] = [];
        try {
          while (true) {
            const { done, value } = await r.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.trim()) continue;
              let chunk: OllamaStreamChunk;
              try {
                chunk = JSON.parse(line) as OllamaStreamChunk;
              } catch {
                continue;
              }
              if (chunk.message?.content) content += chunk.message.content;
              if (chunk.done && chunk.message?.tool_calls?.length)
                toolCalls = chunk.message.tool_calls;
            }
          }
        } finally {
          r.releaseLock();
        }
        return { content, toolCalls };
      }

      try {
        // ── Phase 1: stream first response ───────────────────────────────────
        const reader = ollamaBody.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let firstPhaseToolCalls: OllamaToolCallEntry[] = [];

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

              if (chunk.done && chunk.message?.tool_calls?.length) {
                firstPhaseToolCalls = chunk.message.tool_calls;
              }

              if (chunk.done) break;
            }
          }
        } finally {
          reader.releaseLock();
        }

        // ── Phase 2: execute tool calls ───────────────────────────────────────
        if (firstPhaseToolCalls.length > 0) {
          const toolResultMessages: OllamaMessage[] = [];
          const assistantWithTools: OllamaMessage = {
            role: "assistant",
            content: "",
            tool_calls: firstPhaseToolCalls,
          };

          for (const toolCall of firstPhaseToolCalls) {
            const { action, summary } = await executeToolCall(
              session.user.id,
              toolCall,
            );

            if (action) {
              send({
                type: "action",
                name: action.name,
                record: action.record,
              });
            }

            toolResultMessages.push({ role: "tool", content: summary });
          }

          // ── Phase 3: follow-up reply ──────────────────────────────────────
          const followUpMessages: OllamaMessage[] = [
            ...ollamaMessages,
            assistantWithTools,
            ...toolResultMessages,
          ];

          let followUpResponse: Response;
          try {
            followUpResponse = await streamOllamaChat(
              followUpMessages,
              false,
              preferences.ollamaOptions,
            );
          } catch {
            send({ type: "done" });
            controller.close();
            return;
          }

          if (followUpResponse.body) {
            const { content: followUpContent } = await drainBody(
              followUpResponse.body,
            );
            if (followUpContent) {
              for (const token of followUpContent.split(/(?<=\s)|(?=\s)/)) {
                if (token) send({ type: "token", text: token });
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
