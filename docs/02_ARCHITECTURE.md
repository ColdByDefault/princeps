# Architecture

Last updated: 2026-05-07

This is the short developer map of how Princeps is built.

## Stack

```text
Next.js App Router
React + TypeScript
Tailwind CSS + shadcn/ui + Lucide
PostgreSQL + Prisma + pgvector
Better Auth
next-intl
OpenAI / Ollama / Groq through lib/llm-providers
Stripe for billing
Langfuse for optional production LLM tracing
Google APIs for current integrations
```

Use `package.json` for exact versions.

## Repository Shape

```text
app/                 Pages, layouts, API routes, cron routes
components/          Client UI and feature shells
hooks/               Shared client hooks
lib/                 Server logic and cross-cutting systems
messages/            de/en user-facing strings
prisma/              Schema, migrations, generated client
scripts/             Local setup, seed, healthcheck
types/               Client-safe shared types
CONTEXT/             Agent implementation context
docs/                Human wiki
```

## Standard Request Flow

Most features follow this shape:

```text
app/(app)/<feature>/page.tsx
  -> authenticate
  -> load initial data through lib/features/<feature>/
  -> render components/<feature>/<Feature>Shell

client action
  -> fetch app/api/<feature>/*
  -> route authenticates, validates, tier-gates
  -> route delegates to lib/features/<feature>/
  -> lib writes/reads Prisma through @/lib/core/db
```

API routes should stay thin. Business logic belongs in `lib/features/<feature>/`.

## Server And Client Boundary

Server-only code includes:

- Prisma and `@/lib/core/db`.
- Better Auth server helpers.
- LLM provider calls.
- Stripe.
- pgvector queries.
- Integration clients and tokens.
- Node-only parsing or filesystem APIs.

Server-only modules should use `import "server-only"`. Client components must not import a chain that reaches `@/lib/core/db`.

## Auth And Security

Auth uses Better Auth with email/password sessions stored in Postgres.

Important behavior:

- Session expiry is 3 days.
- Sessions refresh after 1 day.
- Password minimum length is 8.
- Username plugin enforces 3-30 character usernames.
- Email verification is currently disabled.
- Password reset links are logged unless a real email provider is wired.

Rate limiting lives in `lib/core/security.ts`. It uses Upstash Redis when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` exist, otherwise an in-memory fallback.

Every server page and API route authenticates independently. `proxy.ts` is not the trust boundary.

## Data Model

`prisma/schema.prisma` is the single model.

Common rules:

- User-owned rows include `userId`.
- Queries and mutations filter by `userId`.
- Feature rows map to client-safe records in `types/api.ts`.
- Knowledge embeddings use pgvector.
- `UsageCounter` stores daily and monthly usage.
- `Integration` stores external provider tokens by `(userId, provider)`.

## AI System

The AI layer is intentionally split:

```text
lib/ai/llm-providers/  Provider abstraction
lib/ai/context/        System prompt slots
lib/ai/tools/          LLM-callable tools
lib/features/chat/           Chat persistence and streaming orchestration
```

Providers:

- OpenAI: chat, streaming, embeddings.
- Ollama: local chat, streaming, embeddings.
- Groq: chat and streaming only.

`CHAT_PROVIDER` selects the active provider. Current code uses it for embeddings too, so Knowledge needs OpenAI or Ollama.

Tools are feature-agnostic. The registry declares schemas and `minTier`; handlers validate arguments, enforce limits, and delegate to feature logic.

## Settings, Tiers, Billing

Settings are mostly stored in `User.preferences`; timezone and tier are direct `User` columns.

Tiers are `free`, `pro`, `premium`, and `enterprise`. Plan values live in `types/billing.ts`. Enforcement lives in `lib/platform/tiers/enforce.ts`.

Stripe owns subscription payment:

- Checkout creates paid subscriptions.
- Customer portal handles management.
- Webhooks sync `User.tier`.
- `/onboarding/success` syncs immediately after checkout as a fast path.

## Notifications And Weather

Notifications are persistent, user-scoped assistant inbox records.

Weather uses Open-Meteo server-side. The app prefers saved city coordinates, falls back to timezone coordinates, and sends no user ID or IP to the weather provider.

Daily greetings may call the LLM and consume token quota. Overdue-task nudges are deterministic and do not call the LLM.

## Integrations

Integrations are not login accounts. They are external data connectors stored in `Integration` rows.

Current providers:

- `google_calendar`: Calendar events to Meetings plus best-effort write-back.
- `google_drive`: Drive file listing and Knowledge import.

Provider logic belongs in `lib/platform/integrations/<provider>/`; OAuth routes live under `app/api/integrations/<provider>/`.

## Observability

Langfuse tracing wraps chat, streaming chat, and single embeddings in production only.

It is a no-op unless:

```text
NODE_ENV=production
LANGFUSE_PUBLIC_KEY is set
LANGFUSE_SECRET_KEY is set
```

`embedBatch` is not traced.
