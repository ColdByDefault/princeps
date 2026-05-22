# 03 - Backend Structure

Last updated: 2026-05-07

Read this when working on API routes, server logic, Prisma, auth, validation, rate limits, tier gates, or server-only modules.

Reference features:

- `labels` is the cleanest small CRUD backend reference.
- `tasks` is the reference for a quota-gated CRUD backend.
- `knowledge` is a known exception because uploads, extraction, embeddings, and search are not ordinary CRUD.

## Backend Principle

Backend code is split into entrypoints and logic.

API routes receive HTTP requests. Server logic owns business behavior. Prisma access stays behind `lib/`. Client components never reach the database.

The normal request flow is:

```text
app/api/<feature>/route.ts
  -> auth
  -> rate limit / tier gate when needed
  -> parse and validate input
  -> call lib/features/<feature>/
  -> return JSON or 204

lib/features/<feature>/
  -> enforce ownership with userId
  -> read/write Prisma through @/lib/core/db
  -> map DB rows to client-safe records
```

## API Routes

Routes live under `app/api/<feature>/`.

- `route.ts` usually handles `GET` and `POST`.
- `[id]/route.ts` usually handles `PATCH` and `DELETE`.
- Nested routes are allowed for true sub-resources or special actions, such as `goals/[id]/milestones`, `meetings/[id]/prep-pack`, or `knowledge/upload`.

Route handlers should only:

- Read the session with `auth.api.getSession({ headers: await headers() })`.
- Return `401` if unauthenticated.
- Apply write rate limits before mutations.
- Apply tier gates before writes or expensive work.
- Parse request JSON as `unknown`.
- Validate with Zod schemas from `lib/features/<feature>/schemas.ts`.
- Delegate to `lib/features/<feature>/`.
- Convert logic results into HTTP responses.

Routes should not contain business rules, direct Prisma queries, raw SQL, LLM calls, or reusable transforms.

## Server Logic

Feature logic lives in `lib/features/<feature>/`.

Common files:

```text
lib/features/<feature>/
  schemas.ts          Zod inputs and inferred TS types
  shared.logic.ts     Prisma select/include and DB-row -> API-record mapper
  create.logic.ts     Create operation and create-side effects
  list.logic.ts       User-scoped list/read queries
  update.logic.ts     Patch operation and update-side effects
  delete.logic.ts     Delete or soft-delete operation
  index.ts            Barrel exports
```

Rules:

- Files that import Prisma or other server-only dependencies start with `import "server-only"`.
- Accept `userId` from the caller; do not discover the current user inside generic logic functions.
- Use `where: { userId }` or `where: { id, userId }` on user-owned data.
- Return client-safe records, not raw Prisma rows.
- Keep operation files focused. If a helper is shared, put it in `shared.logic.ts`.
- Use typed result unions for expected outcomes such as `notFound`, `duplicate`, or `error`.

`schemas.ts` is the exception: it usually imports Zod and shared constants only. It should not import Prisma or perform business logic.

## Data Mapping

`shared.logic.ts` is the serialization boundary.

It should define:

- A stable Prisma `select` or `include`.
- A row type matching that selection.
- A `toXxxRecord()` mapper.

The mapper converts backend-only shapes into client-safe API records:

- `Date` becomes ISO string.
- Nullable DB fields stay explicit.
- Join rows become simple arrays such as `labels` or `goals`.
- Internal fields such as `userId`, normalized names, tokens, secrets, and provider credentials are omitted unless explicitly needed.

Use `types/api.ts` for shared client-facing record shapes.

## Auth And Ownership

Authentication happens at entrypoints:

- API routes authenticate before doing any work.
- Server pages authenticate before fetching user data.
- Cron routes authenticate with the cron secret before running jobs.
- Webhook routes verify provider signatures or secrets before trusting payloads.

Authorization is enforced in queries:

- User-owned reads filter by `userId`.
- Updates use `where: { id, userId }` when Prisma supports it for the model.
- Deletes prefer `deleteMany({ where: { id, userId } })` and check `count`.
- Never fetch a row by `id` and then mutate it without user ownership in the mutation.

`proxy.ts` is only a coarse routing helper. It is not sufficient access control.

## Validation And Errors

Use Zod for request bodies.

Pattern:

```text
const body = (await req.json()) as unknown
const parsed = schema.safeParse(body)
```

Avoid fake generics on `req.json()`.

HTTP response shape:

- `401` unauthenticated.
- `400` invalid input.
- `403` plan or permission gate.
- `404` user-owned record not found.
- `409` duplicate or conflict.
- `429` rate-limited.
- `500` unexpected server error.
- `502` upstream provider failure.

Standard error body is `{ error: string }`. Error strings are technical route responses; user-facing UI turns them into localized notices.

## Rate Limits And Tier Gates

Use `lib/core/security.ts` for route-level burst protection.

- `writeRateLimiter` for ordinary create/update/delete routes.
- Specialized limiters for chat, upload, search, briefing, prep pack, auth, or voice routes.
- Use `getRateLimitIdentifier(req, session.user.id)` and `createRateLimitResponse()`.

Use `lib/platform/tiers/enforce.ts` for plan gates.

- Count-at-rest limits check current user-owned record counts.
- Daily/monthly counters live in `UsageCounter`.
- Gates run before writes or expensive calls.
- Routes return `createTierLimitResponse(gate.reason)` when blocked.
- Tool handlers must enforce the same create/action gate as API routes.

`tasks` is the simple reference for a `POST` route that rate-limits, then calls `enforceTasksMax()`, then validates and creates.

## Prisma And Schema

`prisma/schema.prisma` is the single data model.

Model conventions:

- IDs use `@default(cuid())`.
- Timestamps use `@default(now())` and `@updatedAt` where applicable.
- User-owned models include `userId` and a relation to `User`.
- Add indexes for common `userId`, foreign key, and sorted list queries.
- Use Prisma enums for fixed status/priority/state values.
- Use join tables with composite keys for many-to-many relationships.
- Use `@map` and `@@map` where the schema maps to snake_case database names.

After schema changes, update migrations and regenerate the Prisma client. Do not edit generated files in `prisma/generated/prisma/`.

## Server-Only Boundaries

Add `import "server-only"` to modules that import or use:

- `@/lib/core/db`
- Better Auth server helpers
- LLM provider code
- Stripe server SDK
- pgvector/raw SQL helpers
- filesystem, crypto, or other Node-only APIs
- provider tokens or integration credentials

Client-safe types in `types/` must not import server-only modules.

## Query Patterns

Prefer single-round-trip ownership checks:

- Update with `where: { id, userId }` and handle not found.
- Delete with `deleteMany({ where: { id, userId } })`.
- List with `where: { userId, ...filters }`.

For `exactOptionalPropertyTypes`, build optional filters and update data conditionally:

```text
status ? { status } : {}
input.title !== undefined && { title: input.title }
```

Do not pass possibly undefined fields directly into typed filter objects.

## Backend Checklist

Before finishing backend work, verify:

- API route authenticates independently.
- Write routes rate-limit.
- Quota-gated creates or expensive actions call the correct tier gate.
- Request body is parsed as `unknown` and validated with Zod.
- Business logic is in `lib/features/<feature>/`, not the route.
- All DB queries are user-scoped.
- Server-only modules are marked.
- Dates and joins are mapped to client-safe records.
- Error responses use `{ error: string }`.
- Related docs or context files are updated when the backend contract changes.
