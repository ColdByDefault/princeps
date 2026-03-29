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
import {
  streamOllamaChat,
  type OllamaMessage,
  type OllamaStreamChunk,
  type OllamaToolCallEntry,
} from "@/lib/chat/ollama";
import { chatRateLimiter, getRateLimitIdentifier } from "@/lib/security";
import { getUserPreferences } from "@/lib/settings/get.logic";
import {
  CHAT_TOOLS,
  executeToolCall,
  type ActionResult,
} from "@/lib/chat/tools";

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

  // Stream from Ollama (with tool definitions so the model can create records)
  let ollamaResponse: Response;

  try {
    ollamaResponse = await streamOllamaChat(
      ollamaMessages,
      think,
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

  // ── Helper: drain one Ollama stream and return accumulated state ────────────
  async function drainStream(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let thinking = "";
    let toolCalls: OllamaToolCallEntry[] = [];

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

          if (chunk.message?.thinking) thinking += chunk.message.thinking;
          if (chunk.message?.content) content += chunk.message.content;
          if (chunk.done && chunk.message?.tool_calls?.length) {
            toolCalls = chunk.message.tool_calls;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content, thinking, toolCalls };
  }

  // ── Pipe Ollama stream → SSE response ──────────────────────────────────────
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
      let sentThinkingEvent = false;

      try {
        // ── Phase 1: stream the first Ollama response ─────────────────────────
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

              if (chunk.done && chunk.message?.tool_calls?.length) {
                firstPhaseToolCalls = chunk.message.tool_calls;
              }

              if (chunk.done) break;
            }
          }
        } finally {
          reader.releaseLock();
        }

        // ── Phase 2: execute tool calls if the model requested any ────────────
        if (firstPhaseToolCalls.length > 0) {
          const actions: ActionResult[] = [];
          const toolResultMessages: OllamaMessage[] = [];

          // Build the assistant turn that contained the tool calls
          const assistantWithTools: OllamaMessage = {
            role: "assistant",
            content: assistantContent,
            tool_calls: firstPhaseToolCalls,
          };

          for (const toolCall of firstPhaseToolCalls) {
            const { action, summary } = await executeToolCall(
              session.user.id,
              toolCall,
            );

            if (action) {
              actions.push(action);
              send({
                type: "action",
                name: action.name,
                record: action.record,
              });
            }

            toolResultMessages.push({ role: "tool", content: summary });
          }

          // ── Phase 3: follow-up call so the model acknowledges the results ──
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
              // No tools in follow-up — prevent re-entry loops
            );
          } catch {
            send({ type: "done" });
            controller.close();
            return;
          }

          if (!followUpResponse.body) {
            send({ type: "done" });
            controller.close();
            return;
          }

          const { content: followUpContent, thinking: followUpThinking } =
            await drainStream(followUpResponse.body);

          if (followUpContent) {
            // Stream follow-up tokens word by word for smooth UX
            for (const token of followUpContent.split(/(?<=\s)|(?=\s)/)) {
              if (token) send({ type: "token", text: token });
            }
            assistantContent =
              assistantContent +
              (assistantContent ? "\n\n" : "") +
              followUpContent;
          }

          thinkingContent = thinkingContent || followUpThinking;

          void actions; // already emitted as SSE events above
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
