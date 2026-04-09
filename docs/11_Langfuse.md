# Langfuse — LLM Observability

> **Status: Implemented, not yet tested.**
> No Langfuse account or API keys have been obtained. The integration is complete and compiles cleanly, but has not been exercised against a real Langfuse project.

---

## What Is It

[Langfuse](https://langfuse.com) is an open-source LLM observability platform. It records every LLM call as a "generation" trace: input messages, the model used, output content, token counts, latency, and errors. This lets you inspect, debug, and improve prompts over time.

---

## Implementation

### Package

```
langfuse  (base SDK — manual trace wrapping)
```

`langfuse-openai` and `langfuse-vercel` were ruled out — this project calls OpenAI via raw `fetch`, not the OpenAI SDK client or Vercel AI SDK.

### Files changed

| File                                 | Change                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `lib/llm-providers/observability.ts` | New file — all tracing logic                                               |
| `lib/llm-providers/provider.ts`      | `callChat`, `streamChat`, `embed` now delegate through the traced wrappers |
| `.env.example`                       | Langfuse env vars documented as commented-out entries                      |

### How it works

`lib/llm-providers/observability.ts` exposes three functions:

- **`tracedCallChat`** — wraps a blocking chat call. Records model, input messages, output text, and prompt + completion token counts.
- **`tracedStreamChat`** — wraps a streaming chat call. Accumulates content deltas and any tool calls yielded mid-stream, then records them when the stream ends.
- **`tracedEmbed`** — wraps a single embedding call. Records the input text and the output vector dimension.

All three are transparent pass-throughs: they `yield` / `return` exactly what the underlying provider returns, so callers are unaffected.

`provider.ts` calls each wrapper with the active provider name (`"openAi"`, `"groq"`, `"ollama"`) as metadata, and passes the real provider function as the delegate.

### Guard — production-only

Tracing is a strict no-op unless **all three** conditions are true:

1. `NODE_ENV === "production"`
2. `LANGFUSE_PUBLIC_KEY` is set
3. `LANGFUSE_SECRET_KEY` is set

In development or staging (without keys), every wrapper calls the delegate directly and returns immediately — zero overhead, zero Langfuse imports executed.

### Langfuse client config

```ts
new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
  flushAt: 1, // flush after every event
  flushInterval: 0, // no periodic timer
});
```

`flushAt: 1` / `flushInterval: 0` ensures events are flushed immediately after each call via `client.flushAsync()`. This is required for Next.js serverless environments where the Node process may be frozen or recycled between requests — a background flush timer would silently drop events.

---

## What Is Traced

| Operation    | Generation name | Recorded fields                                                                                         |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------- |
| `callChat`   | `chat`          | provider (metadata), model, input messages, output text, prompt tokens, completion tokens, total tokens |
| `streamChat` | `chat.stream`   | provider (metadata), model, input messages, accumulated output text, all tool calls requested           |
| `embed`      | `embed`         | provider (metadata), input text, output vector dimension                                                |
| Any error    | same name       | `level: "ERROR"`, error message string                                                                  |

`embedBatch` is not traced — bulk ingestion calls have little prompt-debugging value.

---

## Activation Checklist

When ready to activate:

1. Create a project at https://cloud.langfuse.com (or self-host).
2. Copy the project's **Public Key** and **Secret Key**.
3. Add to your production environment:
   ```
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   # Optional — only for self-hosted:
   LANGFUSE_HOST=https://your-langfuse-host.example.com
   ```
4. Deploy. Traces will appear in the Langfuse dashboard under **Generations** after the first LLM call.

No code changes are needed — the integration activates automatically once the env vars are present in production.

---

## Self-Hosting

Langfuse can be self-hosted via Docker Compose. Set `LANGFUSE_HOST` to your instance URL. See the [official self-hosting guide](https://langfuse.com/docs/deployment/self-host).
