/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/context/build";
import {
  getChatMessages,
  saveUserMessage,
  saveAssistantMessage,
  touchChat,
} from "@/lib/chat/messages.logic";
import { setInitialTitle } from "@/lib/chat/create.logic";
import { callChat, streamChat } from "@/lib/chat/provider";
import { type OllamaMessage, type OllamaStreamChunk } from "@/lib/chat/ollama";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import { getUserPreferences } from "@/lib/settings/get.logic";
import { CHAT_TOOLS, executeToolCall } from "@/lib/chat/tools";
import type { ActionResult } from "@/lib/chat/tools";
import { generateAndPushReport } from "@/lib/reports/generate.logic";

type Params = { params: Promise<{ chatId: string }> };

// POST /api/chat/[chatId]/stream
// Body: { message: string; think: boolean }
// Response: text/event-stream with SSE events:
//   data: {"type":"thinking"}           — thinking phase started
//   data: {"type":"token","text":"…"}   — regular content token
//   data: {"type":"done"}               — stream complete
//   data: {"type":"error","message":"…"}
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
        error: `You're sending messages too quickly. Please wait ${rateLimit.retryAfterSeconds}s before trying again.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = (await req.json()) as { message?: unknown; think?: unknown };

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const userMessage = body.message.trim();
  const think = body.think === true;

  const { chatId } = await params;

  // Verify ownership and load history
  const chatData = await getChatMessages(chatId, session.user.id);

  if (!chatData) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // Save the user message now so it's persisted even if the stream fails
  await saveUserMessage(chatId, userMessage);

  const isFirstMessage = chatData.messages.length === 0;

  // Set the title eagerly from the first user message so it persists even
  // if the Ollama stream later fails or produces no content.
  if (isFirstMessage) {
    await setInitialTitle(chatId, userMessage);
  }

  // Load user preferences for inference options and custom instructions
  const preferences = await getUserPreferences(session.user.id);

  // Build the system prompt from all available context
  const systemMessage = await buildSystemPrompt(session.user.id, userMessage, {
    assistantName: preferences.assistantName,
    systemPrompt: preferences.systemPrompt,
    responseStyle: preferences.responseStyle,
    language: preferences.language,
  });

  // Map stored messages to Ollama format
  const historyMessages = chatData.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const ollamaMessages = [
    systemMessage,
    ...historyMessages,
    { role: "user" as const, content: userMessage },
  ];

  // ── Pipe Ollama → SSE response ──────────────────────────────────────────────
  //
  // Strategy: non-streaming first call with tools (avoids the Qwen3
  // think+streaming+tools incompatibility where tool_calls never arrive).
  // • If tool calls → execute → stream the follow-up reply
  // • If no tool calls → send the full content as a single token, then stream
  //   a second call with think so the user still gets real-time output
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      let assistantContent = "";
      let thinkingContent = "";

      try {
        // ── Phase 1: non-streaming call with tools ────────────────────────────
        // think is intentionally omitted here — thinking mode + streaming +
        // tools is unreliable in Qwen3; the follow-up uses think if set.
        const firstResult = await callChat(
          ollamaMessages,
          preferences.ollamaOptions,
          CHAT_TOOLS,
        );

        if (firstResult.thinking) {
          thinkingContent = firstResult.thinking;
          send({ type: "thinking" });
        }

        // ── Phase 2: agentic tool loop ────────────────────────────────────────
        // Keep executing tool calls (and re-calling the LLM with tools) until
        // the model stops requesting tools, then stream the final reply once.
        // This allows multi-step sequences like: create_label → create_contact
        // → create_meeting → … without the model stopping after the first tool.
        let currentResult = firstResult;
        let currentMessages: OllamaMessage[] = [...ollamaMessages];
        const collectedActions: ActionResult[] = [];
        const MAX_TOOL_ROUNDS = 10;
        let toolRounds = 0;

        while (
          currentResult.toolCalls.length > 0 &&
          toolRounds < MAX_TOOL_ROUNDS
        ) {
          toolRounds++;

          const assistantWithTools: OllamaMessage = {
            role: "assistant",
            content: currentResult.content,
            tool_calls: currentResult.toolCalls,
          };

          const toolResultMessages: OllamaMessage[] = [];

          for (const toolCall of currentResult.toolCalls) {
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

          currentMessages = [
            ...currentMessages,
            assistantWithTools,
            ...toolResultMessages,
          ];

          // Re-call the LLM with the updated context to check for more tools
          currentResult = await callChat(
            currentMessages,
            preferences.ollamaOptions,
            CHAT_TOOLS,
          );
        }

        // Fire-and-forget: generate report + notification for all collected actions
        if (collectedActions.length > 0) {
          void generateAndPushReport({
            userId: session.user.id,
            userName: session.user.name ?? null,
            locale: preferences.language ?? "en",
            actions: collectedActions,
          });
        }

        const hadToolCalls = toolRounds > 0;

        // ── Phase 3: stream the final reply ──────────────────────────────────
        // If tools were used, stream from the full tool-result context.
        // If no tools were used at all, stream from the original messages so
        // the user still gets real-time output with optional extended reasoning.
        let finalStreamResponse: Response;
        try {
          finalStreamResponse = hadToolCalls
            ? await streamChat(
                currentMessages,
                false,
                preferences.ollamaOptions,
              )
            : await streamChat(
                ollamaMessages,
                think,
                preferences.ollamaOptions,
              );
        } catch {
          send({ type: "done" });
          controller.close();
          return;
        }

        const finalBody = finalStreamResponse.body;
        if (finalBody) {
          const reader = finalBody.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let sentThinkingEvent = false;
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
                if (chunk.message?.thinking) {
                  if (!sentThinkingEvent) {
                    send({ type: "thinking" });
                    sentThinkingEvent = true;
                  }
                  thinkingContent += chunk.message.thinking;
                }
                if (chunk.message?.content) {
                  send({ type: "token", text: chunk.message.content });
                  assistantContent += chunk.message.content;
                }
                if (chunk.done) break;
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream error",
        });
      } finally {
        if (assistantContent) {
          await saveAssistantMessage(
            chatId,
            assistantContent,
            thinkingContent || null,
          );
          await touchChat(chatId);
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
