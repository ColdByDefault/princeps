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
} from "@/lib/chat/messages.logic";
import { setInitialTitle } from "@/lib/chat/create.logic";
import { streamChat } from "@/lib/llm-providers/provider";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import { getUserPreferences } from "@/lib/settings/user-preferences.logic";
import { buildSystemPrompt } from "@/lib/context/build";
import type { LLMMessage } from "@/types/llm";

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

  const body = (await req.json()) as { message?: unknown };

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

  // Persist user message immediately
  await saveUserMessage(chatId, userMessage);

  // Auto-title on first message
  if (chatData.messages.length === 0) {
    await setInitialTitle(chatId, userMessage);
  }

  // Build message array for LLM
  const prefs = await getUserPreferences(session.user.id);

  const systemMessage = await buildSystemPrompt(session.user.id, userMessage, {
    language: prefs.language,
  });

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

      try {
        for await (const token of streamChat(llmMessages)) {
          send({ type: "token", text: token });
          assistantContent += token;
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
