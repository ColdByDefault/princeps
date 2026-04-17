/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 *
 * Langfuse observability wrapper for LLM provider calls.
 *
 * Active only when NODE_ENV=production AND both LANGFUSE_PUBLIC_KEY
 * and LANGFUSE_SECRET_KEY are set. All functions are no-ops otherwise.
 *
 * Required env vars (production only):
 *   LANGFUSE_PUBLIC_KEY   — Langfuse project public key
 *   LANGFUSE_SECRET_KEY   — Langfuse project secret key
 *   LANGFUSE_HOST         — (optional) self-hosted URL; defaults to https://cloud.langfuse.com
 */

import "server-only";

import { Langfuse } from "langfuse";
import type {
  LLMChatOptions,
  LLMChatResult,
  LLMMessage,
  LLMToolCall,
} from "@/types/llm";

// ─── Guard ────────────────────────────────────────────────

function isEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.LANGFUSE_PUBLIC_KEY) &&
    Boolean(process.env.LANGFUSE_SECRET_KEY)
  );
}

// ─── Client singleton ─────────────────────────────────────

let _client: Langfuse | null = null;

function getClient(): Langfuse | null {
  if (!isEnabled()) return null;

  if (!_client) {
    _client = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
      // Flush immediately — required for Next.js serverless environments
      // where the process may be reused or terminated between requests.
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return _client;
}

// ─── Traced wrappers ──────────────────────────────────────

/**
 * Wraps a blocking chat call with a Langfuse generation trace.
 * Records model, input messages, output content, and token usage.
 */
export async function tracedCallChat(
  provider: string,
  messages: LLMMessage[],
  options: LLMChatOptions | undefined,
  delegate: (
    messages: LLMMessage[],
    options?: LLMChatOptions,
  ) => Promise<LLMChatResult>,
): Promise<LLMChatResult> {
  const client = getClient();
  if (!client) return delegate(messages, options);

  const generation = client.generation({
    name: "chat",
    metadata: { provider },
    model: options?.model ?? null,
    input: messages,
    modelParameters: {
      ...(options?.temperature !== undefined && {
        temperature: options.temperature,
      }),
      ...(options?.contextLength !== undefined && {
        maxTokens: options.contextLength,
      }),
    },
  });

  try {
    const result = await delegate(messages, options);

    generation.end({
      output: result.content,
      model: result.model,
      usage: {
        input: result.promptTokens,
        output: result.completionTokens,
        total: result.promptTokens + result.completionTokens,
        unit: "TOKENS",
      },
    });

    return result;
  } catch (error) {
    generation.end({ level: "ERROR", statusMessage: String(error) });
    throw error;
  } finally {
    await client.flushAsync();
  }
}

/**
 * Wraps a streaming chat call with a Langfuse generation trace.
 * Accumulates yielded text and tool calls; records them when the stream ends.
 */
export async function* tracedStreamChat(
  provider: string,
  messages: LLMMessage[],
  options: LLMChatOptions | undefined,
  delegate: (
    messages: LLMMessage[],
    options?: LLMChatOptions,
  ) => AsyncGenerator<string | LLMToolCall>,
): AsyncGenerator<string | LLMToolCall> {
  const client = getClient();

  if (!client) {
    yield* delegate(messages, options);
    return;
  }

  const generation = client.generation({
    name: "chat.stream",
    metadata: { provider },
    model: options?.model ?? null,
    input: messages,
    modelParameters: {
      ...(options?.temperature !== undefined && {
        temperature: options.temperature,
      }),
      ...(options?.contextLength !== undefined && {
        maxTokens: options.contextLength,
      }),
    },
  });

  let outputText = "";
  const toolCalls: LLMToolCall[] = [];

  try {
    for await (const chunk of delegate(messages, options)) {
      if (typeof chunk === "string") {
        outputText += chunk;
      } else {
        toolCalls.push(chunk);
      }
      yield chunk;
    }

    generation.end({
      output:
        toolCalls.length > 0
          ? { text: outputText, tool_calls: toolCalls }
          : outputText,
    });
  } catch (error) {
    generation.end({ level: "ERROR", statusMessage: String(error) });
    throw error;
  } finally {
    await client.flushAsync();
  }
}

/**
 * Wraps a single-text embedding call with a Langfuse generation trace.
 * Records the input text and the resulting vector dimension.
 */
export async function tracedEmbed(
  provider: string,
  text: string,
  delegate: (text: string) => Promise<number[]>,
): Promise<number[]> {
  const client = getClient();
  if (!client) return delegate(text);

  const generation = client.generation({
    name: "embed",
    metadata: { provider },
    input: text,
  });

  try {
    const result = await delegate(text);
    generation.end({ output: `vector[${result.length}]` });
    return result;
  } catch (error) {
    generation.end({ level: "ERROR", statusMessage: String(error) });
    throw error;
  } finally {
    await client.flushAsync();
  }
}
