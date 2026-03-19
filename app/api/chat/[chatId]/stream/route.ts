/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/chat/context.logic";
import {
  getChatMessages,
  saveUserMessage,
  saveAssistantMessage,
  touchChat,
} from "@/lib/chat/messages.logic";
import { setInitialTitle } from "@/lib/chat/create.logic";
import { streamOllamaChat, type OllamaStreamChunk } from "@/lib/chat/ollama";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";

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
      { error: "Too many requests" },
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

  // Build the system prompt from all available context
  const systemMessage = await buildSystemPrompt(session.user.id, chatId);

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

  // Stream from Ollama
  let ollamaResponse: Response;

  try {
    ollamaResponse = await streamOllamaChat(ollamaMessages, think);
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

  // Pipe Ollama stream → SSE response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = ollamaBody.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      let thinkingContent = "";
      let buffer = "";
      let sentThinkingEvent = false;

      const send = (event: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

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

            // Thinking token — signal once, accumulate privately
            if (chunk.message?.thinking) {
              if (!sentThinkingEvent) {
                send({ type: "thinking" });
                sentThinkingEvent = true;
              }

              thinkingContent += chunk.message.thinking;
            }

            // Regular content token
            if (chunk.message?.content) {
              send({ type: "token", text: chunk.message.content });
              assistantContent += chunk.message.content;
            }

            if (chunk.done) break;
          }
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream error",
        });
      } finally {
        reader.releaseLock();

        // Persist the assembled assistant response
        if (assistantContent) {
          await saveAssistantMessage(
            chatId,
            assistantContent,
            thinkingContent || null,
          );

          await touchChat(chatId);

          // Set title from first user message
          if (isFirstMessage) {
            await setInitialTitle(chatId, userMessage);
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
