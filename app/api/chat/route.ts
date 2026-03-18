/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { getConversation } from "@/lib/chat/get.logic";
import {
  sendConversationMessage,
  streamConversationMessage,
} from "@/lib/chat/send.logic";
import { chatMessageInputSchema } from "@/lib/chat/shared.logic";
import { type ChatConversation, type ChatStreamEvent } from "@/types/chat";
import {
  chatRateLimiter,
  createRateLimitResponse,
  getRateLimitIdentifier,
  searchRateLimiter,
} from "@/lib/security";

function toChatConversation(
  value: Awaited<ReturnType<typeof getConversation>>,
): ChatConversation {
  return {
    ...value,
    messages: value.messages.map((message) => ({
      ...message,
      role: message.role as ChatConversation["messages"][number]["role"],
    })),
  };
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = searchRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const conversation = await getConversation(session.user.id);

    return NextResponse.json({
      conversation: toChatConversation(conversation),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = chatRateLimiter.check(
    getRateLimitIdentifier(req, session.user.id),
  );

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit.retryAfterSeconds,
      "Too many chat requests",
    );
  }

  try {
    const { message, stream } = chatMessageInputSchema.parse(
      (await req.json()) as Record<string, unknown>,
    );

    if (stream) {
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        start(controller) {
          const sendEvent = (event: ChatStreamEvent) => {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          };

          void (async () => {
            try {
              const result = await streamConversationMessage(
                session.user.id,
                message,
                (chunk) => {
                  sendEvent({ type: "chunk", content: chunk });
                },
              );

              sendEvent({ type: "sources", sources: result.sources });
              sendEvent({
                type: "done",
                conversation: toChatConversation(result.conversation),
                reply: result.reply,
                sources: result.sources,
              });
              controller.close();
            } catch (error) {
              try {
                const fallback = await sendConversationMessage(
                  session.user.id,
                  message,
                );

                sendEvent({ type: "sources", sources: fallback.sources });
                sendEvent({ type: "chunk", content: fallback.reply });
                sendEvent({
                  type: "done",
                  conversation: toChatConversation(fallback.conversation),
                  reply: fallback.reply,
                  sources: fallback.sources,
                });
                controller.close();
              } catch (fallbackError) {
                const message =
                  fallbackError instanceof Error
                    ? fallbackError.message
                    : error instanceof Error
                      ? error.message
                      : "Failed to send chat message";

                sendEvent({ type: "error", error: message });
                controller.close();
              }
            }
          })();
        },
      });

      return new Response(streamResponse, {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "Content-Type": "application/x-ndjson; charset=utf-8",
        },
      });
    }

    const result = await sendConversationMessage(session.user.id, message);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      (error.message === "LLM request failed" ||
        error.message === "LLM response was empty")
    ) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to send chat message" },
      { status: 500 },
    );
  }
}
