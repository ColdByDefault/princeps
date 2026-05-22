# 05 - LLM Providers

Last updated: 2026-05-07

Read this before changing model calls, provider settings, streaming, embeddings, or provider health UI.

## Purpose

`lib/ai/llm-providers/` is the server-only abstraction around external and local LLM backends.

The rest of the app should call the shared interface:

```ts
callChat(messages, options)
streamChat(messages, options)
embed(text)
embedBatch(texts)
```

Do not call OpenAI, Ollama, or Groq files directly from feature code unless you are building provider-specific diagnostics.

## Supported Providers

```text
openAi   OpenAI chat + embeddings
ollama   Local Ollama chat + embeddings
groq     Groq chat only; embeddings throw a descriptive error
```

The active provider is selected at request time from:

```text
CHAT_PROVIDER=openAi | ollama | groq
```

Default is `openAi`.

Important: current live code uses `CHAT_PROVIDER` for both chat and embeddings. There is no separate `EMBEDDING_PROVIDER` switch yet. If `CHAT_PROVIDER=groq`, knowledge upload/search embedding calls fail because Groq does not support embeddings.

## Main Files

```text
lib/ai/llm-providers/index.ts              Barrel export
lib/ai/llm-providers/provider.ts           Public dispatcher
lib/ai/llm-providers/observability.ts      Langfuse wrappers
lib/ai/llm-providers/openai/
  openai.ts                             Chat + streaming
  openai-embedding.ts                   Single + batch embeddings
  openai-settings.ts                    Env parsing, model lists, errors
lib/ai/llm-providers/ollama/
  ollama.ts                             Chat + streaming
  ollama-embedding.ts                   Single + batch embeddings
  ollama-settings.ts                    Env parsing, model lists, errors
lib/ai/llm-providers/groq/
  groq.ts                               Chat + streaming
  groq-embedding.ts                     Unsupported embedding stubs
  groq-settings.ts                      Env parsing, model lists, errors
lib/ai/llm-providers/shared/provider-health.ts
lib/ai/llm-providers/shared/provider-test.ts
types/llm.ts                            Shared message, tool, status types
lib/platform/settings/provider-status.logic.ts   `/settings` provider status payload
```

All provider implementation files must remain server-only.

## Public Contract

`types/llm.ts` defines the shared shape:

- `LLMMessage`: `system`, `user`, `assistant`, or `tool`.
- `LLMChatOptions`: optional model, temperature, context length, timeout, tools.
- `LLMChatResult`: text content, model name, prompt/completion token counts.
- `LLMToolCall`: OpenAI-compatible function-call shape emitted by streaming providers.

Provider callers should import from:

```ts
import { callChat, streamChat, embed, embedBatch } from "@/lib/llm-providers";
```

## Chat Flow

```text
Feature/server route
  -> callChat() or streamChat()
  -> provider.ts resolves CHAT_PROVIDER
  -> traced wrapper records Langfuse metadata in production
  -> provider-specific implementation calls external/local API
```

Main chat uses `streamChat()` in `app/api/chat/[chatId]/stream/route.ts`.

That route:

1. Authenticates and rate-limits the user.
2. Enforces monthly LLM quotas.
3. Builds the system prompt from `lib/ai/context/build.ts`.
4. Loads tier/user-filtered tools from `lib/tools`.
5. Streams tokens and tool-call events.
6. Executes requested tools for up to 6 rounds.
7. Saves the assistant response and usage counters.

## Tool Calling

OpenAI and Groq streaming can yield either:

```text
string token
LLMToolCall
```

Ollama streaming currently yields text only. Its provider ignores `options.tools`, so do not assume LLM tool calling works when `CHAT_PROVIDER=ollama`.

The route-level executor still handles provider output defensively, but tool-capable behavior depends on the selected provider and model.

## Embeddings

Knowledge upload and search use:

```text
lib/features/knowledge/create.logic.ts -> embedBatch()
lib/features/knowledge/search.logic.ts -> embed()
```

Vectors are normalized to `EMBEDDING_DIM = 1536` in `lib/features/knowledge/shared.logic.ts`, so Ollama vectors with smaller dimensions are padded before storage in pgvector.

OpenAI supports embeddings through `/embeddings`.
Ollama supports embeddings through `/api/embed`.
Groq embeddings are intentionally unsupported and throw `GroqProviderError`.

## Provider Status

Settings reads provider health through:

```text
GET /api/settings/provider-status
  -> lib/platform/settings/provider-status.logic.ts
  -> shared/provider-health.ts
```

Health checks:

- OpenAI: calls `/models`, intersects with curated OpenAI chat/embedding model lists.
- Ollama: calls `/api/version` and `/api/tags`.
- Groq: calls `/models`, intersects with curated Groq chat model list.

`ProviderTab` and the chat site header consume this status as read-only diagnostics. Provider selection is not changed from the UI; it is environment-driven.

## Env Variables

OpenAI:

```text
OPENAI_API_KEY          required
OPENAI_BASE_URL         default https://api.openai.com/v1
OPENAI_CHAT_MODEL       default gpt-4o-mini
OPENAI_EMBEDDING_MODEL  default text-embedding-3-small
OPENAI_MAX_TOKENS       default 4096
OPENAI_TEMPERATURE      default 0.7
OPENAI_TIMEOUT_MS       default 30000
```

Ollama:

```text
OLLAMA_BASE_URL         default http://localhost:11434
OLLAMA_CHAT_MODEL       default llama3.2
OLLAMA_EMBEDDING_MODEL  default nomic-embed-text
OLLAMA_TIMEOUT_MS       default 30000
OLLAMA_CONTEXT_LENGTH   default 4096
OLLAMA_TEMPERATURE      default 0.7
```

Groq:

```text
GROQ_API_KEY        required
GROQ_MODEL          default llama-3.3-70b-versatile
GROQ_MAX_TOKENS     default 4096
GROQ_TEMPERATURE    default 0.7
GROQ_TIMEOUT_MS     default 30000
```

Langfuse:

```text
LANGFUSE_PUBLIC_KEY
LANGFUSE_SECRET_KEY
LANGFUSE_HOST       default https://cloud.langfuse.com
```

Langfuse tracing only runs in production and only when both keys are present.

## Add Or Change A Provider

Checklist:

- Add a provider folder under `lib/ai/llm-providers/<provider>/`.
- Implement chat, streaming, settings, and error classes.
- Implement embeddings or add explicit unsupported stubs.
- Add the provider to `ActiveProvider` in `types/llm.ts`.
- Add dispatch cases in `lib/ai/llm-providers/provider.ts`.
- Add health checks in `shared/provider-health.ts`.
- Add provider status handling in `lib/platform/settings/provider-status.logic.ts`.
- Update `/settings` provider UI labels and messages in both locales if user-visible.
- Verify chat, streaming, tool-call behavior, provider health, and knowledge embedding behavior.

Keep provider code feature-agnostic. Feature logic belongs in `lib/features/<feature>/`, context slots, or tools, not inside provider adapters.
