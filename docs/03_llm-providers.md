# LLM Provider Abstraction


> Important: This document is a work in progress and may not reflect the final implementation. It is intended to provide an overview of the new LLM provider system architecture and key files, but details are subject to change as development progresses. Please refer to the latest codebase for the most up-to-date information.
  
## Overview

All LLM access goes through a single **active-provider dispatcher** (`lib/llm-providers/provider.ts`). Chat and any other consumer call the dispatcher — never a specific provider directly. Switching providers is a single env-var change.

---

## Supported Providers

| Value (`CHAT_PROVIDER`) | Type  | Notes                                                                                                                                        |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openAi` _(default)_    | API   | OpenAI; requires `OPENAI_API_KEY`                                                                                                            |
| `ollama`                | Local | Self-hosted Ollama server; requires `OLLAMA_BASE_URL`                                                                                        |
| `groq`                  | API   | Groq API; requires `GROQ_API_KEY`. Available models are hardcoded in `groq-settings.ts` — Groq's API returns all models, not a filtered list |

---

## File Layout

```
lib/llm-providers/
  provider.ts              Active provider dispatcher — callChat(), streamChat(), callEmbed()
  openai/
    openai.ts              Chat implementation
    openai-embedding.ts    Embedding implementation
    openai-settings.ts     Config, model lists, env helpers
  ollama/
    ollama.ts
    ollama-embedding.ts
    ollama-settings.ts
  groq/
    groq.ts
    groq-embedding.ts
    groq-settings.ts       Hardcoded model list (GROQ_CHAT_MODELS)
  shared/
    provider-health.ts     Health check for all providers — always resolves, never throws
    provider-test.ts       Connection test utilities
types/llm.ts               Shared type contracts (LLMMessage, LLMChatOptions, LLMChatResult, LLMEmbedResult, ProviderHealthStatus)
```

---

## Dispatcher Contract (`provider.ts`)

```ts
callChat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResult>
streamChat(messages: LLMMessage[], options?: LLMChatOptions): Promise<ReadableStream>
callEmbed(input: string | string[], options?: ...): Promise<LLMEmbedResult>
```

`CHAT_PROVIDER` is read at call time — restart is not required when toggling providers during development.

---

## Shared Type Contracts (`types/llm.ts`)

| Type                   | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `LLMMessage`           | `{ role: "system" \| "user" \| "assistant", content: string }` |
| `LLMChatOptions`       | `model`, `temperature`, `contextLength`, `timeoutMs`           |
| `LLMChatResult`        | `content`, `model`, `promptTokens`, `completionTokens`         |
| `LLMEmbedResult`       | `embeddings`, `model`                                          |
| `ProviderHealthStatus` | `connected`, `version`, `models[]`                             |

---

## Rules

- Chat consumes `lib/llm-providers/provider.ts` — it must never import a specific provider directly.
- Provider modules are `server-only`.
- Adding a new provider requires: new folder under `lib/llm-providers/`, update `provider.ts` switch, add env config to `*-settings.ts`.
- Health checks are non-throwing by design — errors surface in `result.error`, not as exceptions.
