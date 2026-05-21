---
description: "Backend rules for API routes, server logic, Prisma, auth, validation, rate limits, tier gates, and server-only boundaries."
name: "Princeps Server And Data"
applyTo: "app/api/**,lib/**,prisma/**,proxy.ts"
---

# Princeps Server And Data

Read `CONTEXT/03_BACKEND_STRUC.md` when backend behavior is non-trivial. Verify live code before editing.

## Route Shape

- API handlers are thin: authenticate, rate-limit or tier-gate when needed, parse, validate, delegate to `lib/features/<feature>/`, and return JSON or `204`.
- One route file per resource operation or small group (e.g. `route.ts` for GET+POST, `[id]/route.ts` for PATCH+DELETE).
- Route handlers never contain business logic, direct Prisma queries, raw SQL, reusable transforms, or LLM calls directly.

## Feature Logic — `lib/features/<feature>/`

- One file per operation: `create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`.
- `shared.logic.ts` — Prisma `include` definitions, `toXxxRecord()` shape mapping, shared helpers.
- `schemas.ts` — Zod validators for create/update inputs.
- Logic files own validation, authorization checks, side effects (interaction logging, label linking), and DB access.

## Tools — `lib/ai/tools/`

- `registry.ts` — imports/spreads feature registries and applies tier filtering.
- `registry/<feature>.registry.ts` — feature-owned tool definitions in OpenAI function-calling schema format.
- `types.ts` — `ActionResult` and `ToolHandler` types shared across all handler files.
- `executor.ts` — thin dispatcher: parses JSON args, looks up the handler by tool name, calls it. **Never add feature logic here.** New features only import/spread handler maps.
- `handlers/<feature>.handler.ts` — one file per feature domain. Owns validation (Zod `safeParse`), name→ID resolution, duplicate checks, and delegation to `lib/features/<feature>/` logic. Returns `ActionResult`.
- `resolvers.ts` — shared name→ID helpers (`resolveOrCreateLabelIdsByNames`, `resolveLabelIdByName`, etc.) used across handler files.
- Tools are feature-agnostic. Chat, cron, webhooks, and future agents all consume the same executor.
- If an API action has a tier or usage gate, the equivalent tool handler must enforce the same gate.

## LLM Provider — `lib/ai/llm-providers/`

- Abstracted provider layer exposing `callChat()`, `streamChat()`, `embed()`.
- OpenAI is the primary provider. Ollama and Groq are also wired through the provider abstraction where supported.
- Provider receives tool schemas from `lib/ai/tools/registry.ts` — it does not define or own them.
- Provider modules are server-only and must not be imported by client components.

## Context Assembly — `lib/ai/context/`

- `build.ts` — assembles the full system prompt from slots.
- `<feature>.slot.ts` — each slot retrieves and formats one section of user data (tasks, meetings, contacts, decisions, knowledge, personal info, preferences).
- Output: a complete system message string, ready to pass to the LLM provider.
- Lives outside `lib/features/chat/`. Chat consumes it; other future surfaces can too.

## Auth And Access

- Read the session with `auth.api.getSession({ headers: await headers() })`.
- Do not assume middleware or `proxy.ts` is sufficient for access control. Server pages and API routes must still enforce auth.
- All queries are user-scoped. Filter by `userId` unless the code is intentionally admin-only.

## Validation And Errors

- Validate inputs with Zod schemas in `lib/features/<feature>/schemas.ts`.
- Cast `req.json()` results with `as`, then validate. Do not use fake generics on `req.json()`.
- Standard error response shape: `{ error: string }`.
- Status codes: `401` unauthenticated, `400` invalid input, `403` plan or permission gate, `404` not found, `409` conflict or duplicate, `429` rate-limited, `502` upstream provider failure, `500` unexpected server error.
- Reuse `lib/core/security.ts` helpers for input normalization and rate limiting.

## Data Layer

- Import Prisma only from `@/lib/core/db`.
- Generated Prisma client lives in `prisma/generated/prisma`; do not edit generated files.
- Keep all database access in `lib/` server logic, never in components.
- Pgvector: `KnowledgeChunk.embedding` uses `Unsupported("vector(...)")`. Vector reads/writes use raw SQL.
- After schema changes: update migrations, regenerate client.

## Query Patterns

- User-owned reads filter by `userId`.
- Updates use `where: { id, userId }` when supported and handle not found.
- Deletes prefer `deleteMany({ where: { id, userId } })` and check `count`.
- For `exactOptionalPropertyTypes`, build optional filters and update data conditionally instead of passing possibly undefined fields directly.

## Server-Only Boundaries

- Any module importing Prisma, Better Auth server helpers, LLM provider code, or Node-only APIs must be server-only.
- Add `import "server-only"` to every such module.
- Never let a client import chain reach `@/lib/core/db`.

## Validation Timing

- Run `npm run lint`, `npm run typecheck`, and `npm run build` when a task or feature is complete, or when a change is risky.
- Do not run the full trio after every intermediate step.
