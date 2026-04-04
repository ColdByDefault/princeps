---
description: "API routes, server logic, Prisma, auth, validation, tools, LLM provider, and server/client boundaries."
name: "See-Sweet Server And Data"
applyTo: "app/api/**, lib/**, prisma/**, proxy.ts"
---

# See-Sweet Server And Data

## Route Shape

- API handlers are thin: authenticate → parse input → delegate to `lib/<feature>/` → return `NextResponse.json(...)`.
- One route file per resource operation or small group (e.g. `route.ts` for GET+POST, `[id]/route.ts` for PATCH+DELETE).
- Route handlers never contain business logic, SQL, or LLM calls directly.

## Feature Logic — `lib/<feature>/`

- One file per operation: `create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`.
- `shared.logic.ts` — Prisma `include` definitions, `toXxxRecord()` shape mapping, shared helpers.
- `schemas.ts` — Zod validators for create/update inputs.
- Logic files own validation, authorization checks, side effects (interaction logging, label linking), and DB access.

## Tools — `lib/tools/`

- `registry.ts` — every tool the LLM can call, defined in OpenAI function-calling schema format.
- `types.ts` — `ActionResult` and `ToolHandler` types shared across all handler files.
- `executor.ts` — thin dispatcher: parses JSON args, looks up the handler by tool name, calls it. **Never add feature logic here.** Adding a new feature = spread its handler map into `HANDLERS` and done.
- `handlers/<feature>.handler.ts` — one file per feature domain. Owns validation (Zod `safeParse`), name→ID resolution, duplicate checks, and delegation to `lib/<feature>/` logic. Returns `ActionResult`.
- `resolvers.ts` — shared name→ID helpers (`resolveOrCreateLabelIdsByNames`, `resolveLabelIdByName`, etc.) used across handler files.
- Tools are feature-agnostic. Chat, cron, webhooks, and future agents all consume the same executor.

## LLM Provider — `lib/llm/`

- Abstracted provider layer exposing `callChat()`, `streamChat()`, `embed()`.
- OpenAI is the primary provider. The abstraction keeps the door open for alternatives without changing consumers.
- Provider receives tool schemas from `lib/tools/registry.ts` — it does not define or own them.
- Streaming uses OpenAI SSE format natively.

## Context Assembly — `lib/context/`

- `build.ts` — assembles the full system prompt from slots.
- `<feature>.slot.ts` — each slot retrieves and formats one section of user data (tasks, meetings, contacts, decisions, knowledge, personal info, preferences).
- Output: a complete system message string, ready to pass to the LLM provider.
- Lives outside `lib/chat/`. Chat consumes it; other future surfaces can too.

## Auth And Access

- Read the session with `auth.api.getSession({ headers: await headers() })`.
- Do not assume middleware or `proxy.ts` is sufficient for access control. Server pages and API routes must still enforce auth.
- All queries are user-scoped. Filter by `userId` unless the code is intentionally admin-only.

## Validation And Errors

- Validate inputs with Zod schemas in `lib/<feature>/schemas.ts`.
- Cast `req.json()` results with `as`, then validate. Do not use fake generics on `req.json()`.
- Standard error response shape: `{ error: string }`.
- Status codes: `401` unauthenticated, `400` invalid input, `429` rate-limited, `502` upstream provider failure, `500` unexpected server error.
- Reuse `lib/security.ts` helpers for input normalization and rate limiting.

## Data Layer

- Import Prisma only from `@/lib/db`.
- Generated Prisma client in `lib/generated/prisma`.
- Keep all database access in `lib/` server logic, never in components.
- Pgvector: `KnowledgeChunk.embedding` uses `Unsupported("vector(...)")`. Vector reads/writes use raw SQL.
- After schema changes: update migrations, regenerate client.

## Server-Only Boundaries

- Any module importing Prisma, Better Auth server helpers, LLM provider code, or Node-only APIs must be server-only.
- Add `import "server-only"` to every such module.
- Never let a client import chain reach `@/lib/db`.

## Validation Timing

- Run `npm run lint`, `npm run typecheck`, and `npm run build` when a task or feature is complete, or when a change is risky.
- Do not run the full trio after every intermediate step.
