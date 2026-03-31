/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import type {
  OllamaToolCallEntry,
  OllamaToolDefinition,
  OllamaMessage,
  OllamaChatOptions,
  OllamaChatResult,
  OllamaStreamChunk,
} from "@/lib/chat/ollama";

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? "";

// ─── Format converters ────────────────────────────────────────────────────────

/**
 * Convert OllamaMessage[] to OpenAI-compatible message objects.
 * Generates synthetic tool_call_id values (call_0, call_1, …) so that
 * follow-up messages after tool execution satisfy the OpenAI requirement that
 * every "tool" role message references the id from the assistant's tool_calls.
 */
function toGroqMessages(messages: OllamaMessage[]) {
  const pendingIds: string[] = [];
  const result: Record<string, unknown>[] = [];

  for (const m of messages) {
    if (m.role === "tool") {
      const id = pendingIds.shift() ?? "call_0";
      result.push({ role: "tool", content: m.content, tool_call_id: id });
    } else if (
      m.role === "assistant" &&
      m.tool_calls &&
      m.tool_calls.length > 0
    ) {
      const toolCalls = m.tool_calls.map((tc, i) => {
        const id = `call_${i}`;
        pendingIds.push(id);
        return {
          id,
          type: "function",
          function: {
            name: tc.function.name,
            arguments: JSON.stringify(tc.function.arguments),
          },
        };
      });
      result.push({
        role: "assistant",
        content: m.content ?? "",
        tool_calls: toolCalls,
      });
    } else {
      result.push({ role: m.role, content: m.content });
    }
  }

  return result;
}

function toGroqTools(tools: OllamaToolDefinition[]) {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    },
  }));
}

/** Map the subset of OllamaChatOptions that Groq/OpenAI supports. */
function toGroqOptions(opts?: OllamaChatOptions): Record<string, unknown> {
  if (!opts) return {};
  const result: Record<string, unknown> = {};
  if (opts.temperature !== undefined) result.temperature = opts.temperature;
  if (opts.top_p !== undefined) result.top_p = opts.top_p;
  return result;
}

// ─── Response types ───────────────────────────────────────────────────────────

type GroqToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type GroqNonStreamChoice = {
  message: {
    role: string;
    content: string | null;
    tool_calls?: GroqToolCall[];
  };
};

type GroqNonStreamResponse = { choices: [GroqNonStreamChoice] };

// ─── Non-streaming call (used for tool detection) ─────────────────────────────

export async function callGroqChat(
  messages: OllamaMessage[],
  options?: OllamaChatOptions,
  tools?: OllamaToolDefinition[],
): Promise<OllamaChatResult> {
  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages: toGroqMessages(messages),
    stream: false,
    ...toGroqOptions(options),
  };

  if (tools && tools.length > 0) {
    body.tools = toGroqTools(tools);
    body.tool_choice = "auto";
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq returned ${response.status}: ${text}`);
  }

  const json = (await response.json()) as GroqNonStreamResponse;
  const choice = json.choices[0].message;

  const toolCalls: OllamaToolCallEntry[] = (choice.tool_calls ?? []).map(
    (tc) => ({
      function: {
        name: tc.function.name,
        arguments: (() => {
          try {
            return JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            return {};
          }
        })(),
      },
    }),
  );

  return {
    content: choice.content ?? "",
    thinking: "", // Groq does not expose thinking tokens
    toolCalls,
  };
}

// ─── Streaming call ───────────────────────────────────────────────────────────

/**
 * Calls Groq with streaming enabled and returns a Response whose body emits
 * Ollama-compatible NDJSON so the existing stream-reading loop in the route
 * handler works without modifications.
 *
 * @param _think  Accepted for interface parity; Groq has no explicit think mode.
 */
export async function streamGroqChat(
  messages: OllamaMessage[],
  _think: boolean,
  options?: OllamaChatOptions,
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages: toGroqMessages(messages),
    stream: true,
    ...toGroqOptions(options),
  };

  const groqResponse = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!groqResponse.ok) {
    const text = await groqResponse.text();
    throw new Error(`Groq returned ${groqResponse.status}: ${text}`);
  }

  if (!groqResponse.body) {
    throw new Error("Groq returned no response body");
  }

  const groqBody = groqResponse.body;

  // Transform Groq's SSE (OpenAI format) into Ollama-style NDJSON so the
  // route's reader loop treats it identically to an Ollama response.
  const transformedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = groqBody.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === "data: [DONE]") {
              const doneChunk: OllamaStreamChunk = {
                model: GROQ_MODEL,
                message: { role: "assistant", content: "" },
                done: true,
                done_reason: "stop",
              };
              controller.enqueue(
                encoder.encode(JSON.stringify(doneChunk) + "\n"),
              );
              continue;
            }

            if (!trimmed.startsWith("data: ")) continue;

            let parsed: {
              choices?: [{ delta?: { content?: string | null } }];
            };
            try {
              parsed = JSON.parse(trimmed.slice(6)) as typeof parsed;
            } catch {
              continue;
            }

            const content = parsed.choices?.[0]?.delta?.content ?? "";
            const chunk: OllamaStreamChunk = {
              model: GROQ_MODEL,
              message: { role: "assistant", content },
              done: false,
            };
            controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(transformedStream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
