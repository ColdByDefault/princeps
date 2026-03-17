<!-- 
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 -->
 ---
description: "Use when working on API routes, server logic, Prisma, auth enforcement, or data access in See-Sweet. Covers route shape, validation, user scoping, and server/client boundaries."
name: "See-Sweet Server And Data"
applyTo: "app/api/**, lib/**, prisma/**, proxy.ts"
---

# See-Sweet Server And Data

## Route And Logic Shape

- Keep API handlers thin: authenticate, parse input, call feature logic, return `NextResponse.json(...)`.
- Put business rules in `lib/<feature>/`, usually one operation per `*.logic.ts` plus optional `shared.logic.ts`.
- Preserve the existing feature split where it exists: `create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`, and `shared.logic.ts`.
- Keep chat prompt assembly and retrieval composition in server logic, not inline in route handlers.

## Auth And Access

- Read the session with `auth.api.getSession({ headers: await headers() })`.
- Do not assume `proxy.ts` is sufficient for access control. Server pages and routes must still enforce auth and authorization correctly.
- Most queries are user-scoped. Filter by `userId` unless the path is intentionally admin-only.

## Validation And Errors

- Validate inputs with Zod-backed helpers in server logic.
- Cast `req.json()` results with `as`, then validate them. Do not use fake generics on `req.json()`.
- Use `{ error: string }` for error responses.
- Return `401` for unauthenticated requests, `400` for invalid input, `429` for rate-limited requests, `502` for upstream provider failures, and `500` only for unexpected server errors.
- Reuse `lib/security.ts` helpers for normalization and rate limiting when relevant.

## Data Layer

- Import Prisma only from `@/lib/db`.
- Keep database access in server logic, not in components.
- Generated Prisma client output lives in `lib/generated/prisma`.
- Pgvector access stays server-only. `DocumentChunk.embedding` uses `Unsupported("vector(4096)")`, so vector reads and writes rely on raw SQL.
- After schema changes, update migrations and regenerate the Prisma client.

## Server-Only Boundaries

- Any module that imports Prisma, Better Auth server helpers, environment-dependent provider code, or other Node-only APIs must remain server-only.
- Add `import "server-only";` to helpers that should never be imported into client bundles.
- Never let a client import chain reach `@/lib/db`; that pulls `pg` into the browser bundle and breaks builds.

## Validation Timing

- Run `npm run lint`, `npm run typecheck`, and `npm run build` when the task or feature is complete, or when the change is risky or critical.
- Do not run the full validation trio after every intermediate step.
