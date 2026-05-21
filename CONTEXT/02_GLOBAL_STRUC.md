# 02 - Global Structure

Last updated: 2026-05-07

Read this after `01_GLOBAL_SCOPE.md`. This file explains where code belongs in the Princeps repo and how the main layers relate. It is a map, not a feature implementation checklist.

## Root Map

```text
app/                 Next.js App Router pages, layouts, API routes, metadata
components/          Client UI, shared UI, shadcn primitives, feature shells
hooks/               Cross-feature client hooks
i18n/                next-intl request configuration
lib/                 Server logic, tools, context, providers, integrations
messages/            German and English UI strings
prisma/              Schema, migrations, generated Prisma client
public/              Static assets
scripts/             Local maintenance, seed, healthcheck, setup scripts
types/               Client-safe shared types and contracts
docs/                Product and implementation decisions
CONTEXT/             Agent-readable working context
.github/             Agent instructions, workflows, PR templates, hooks
```

Generated Prisma code currently lives in `prisma/generated/prisma`. Application code imports the DB only through `@/lib/core/db`.

## App Layer

`app/` owns routing and request entrypoints.

- `app/layout.tsx` sets global providers: `next-intl`, theme, tooltip provider, and toaster.
- `app/(app)/` contains user-facing pages and route groups.
- `app/(app)/<feature>/page.tsx` is a server page: authenticate, fetch data, serialize props, render the client shell.
- `app/api/<feature>/` contains route handlers. They stay thin: authenticate, parse, validate, delegate to `lib/features/<feature>/`, return a response.
- `app/api/cron/` contains scheduled jobs gated by cron auth.
- `proxy.ts` handles coarse redirects and language cookie seeding, but does not replace per-route auth.

Do not put business logic, direct Prisma access, or LLM calls in pages or route handlers when a `lib/` layer exists for the domain.

## Component Layer

`components/` owns UI rendering and client-side interaction.

- `components/<feature>/` contains feature UI: shell, cards, dialogs, forms, and a barrel `index.ts`.
- `components/<feature>/logic/` contains hooks, API calls, local mutation state, transforms, and client helpers.
- `components/shared/` contains project-level reusable UI such as notices and confirm dialogs.
- `components/ui/` contains shadcn/ui primitives. Treat these as vendor-style primitives; do not casually rewrite them.
- `components/navigation/`, `components/theme/`, `components/chat-widget/`, and similar folders hold cross-feature UI surfaces.

Component `.tsx` files should focus on JSX and composition. Move repeated behavior or API orchestration into `logic/`.

## Server Logic Layer

`lib/` owns server-side behavior and cross-cutting application logic. It is organized into five sub-namespaces:

- `lib/core/` — shared infrastructure: `db.ts`, `auth/`, `utils.ts`, `security.ts`, `seo.ts`, `i18n.ts`, `dev/`.
- `lib/features/<feature>/` — feature business logic: schemas, CRUD operations, shared selectors, mappers, side effects, and authorization checks. Covers: briefings, chat, contacts, decisions, goals, knowledge, labels, meeting-recaps, meetings, memory, notifications, profile, reports, tasks.
- `lib/ai/` — everything LLM-related: `llm-providers/`, `context/`, `tools/`, `agents/`.
- `lib/platform/` — billing and behavior configuration: `settings/`, `tiers/`, `stripe/`, `integrations/`.
- `lib/services/` — stateless external API clients: `weather/`, `web-research/`.
- Server-only modules that import Prisma, auth server helpers, LLM providers, Stripe, pgvector, or Node-only APIs should use `import "server-only"`.

Server logic accepts `userId` from the caller. It should not assume global user state.

## AI Layer

The AI system is split into separate reusable layers under `lib/ai/`.

- `lib/ai/llm-providers/` abstracts chat, streaming, embeddings, provider health, and Langfuse tracing.
- `lib/ai/context/` builds the system prompt from user-scoped slots such as tasks, meetings, contacts, knowledge, goals, and memory.
- `lib/ai/tools/` defines and executes LLM-callable tools.
- `lib/features/chat/` persists conversations and orchestrates chat streaming, but does not own tools, providers, or context assembly.

This separation matters because chat, cron jobs, webhooks, and future agents should be able to reuse tools and context without copying chat internals.

## Data Layer

`prisma/` owns the schema and database history.

- `prisma/schema.prisma` is the single data model.
- `prisma/migrations/` is the migration history.
- `prisma/generated/prisma/` is generated code; do not edit manually.
- `lib/core/db.ts` creates the Prisma client and exports `db` / `prisma`.

All data access should go through server-side logic. Client components never import Prisma or `@/lib/core/db`.

## Type And Locale Layer

- `types/` contains shared client-safe contracts, enums, and API record shapes. It must not import server-only modules.
- `messages/de.json` and `messages/en.json` contain all user-facing UI strings.
- `i18n/request.ts` resolves locale for `next-intl`.
- Technical logs and validation details stay English. User-facing notices, labels, placeholders, tooltips, and buttons are localized.

## Standard Flow

Most feature work follows this flow:

```text
Server page
  -> auth + initial data from lib/features/<feature>/
  -> client shell in components/<feature>/
  -> user action calls app/api/<feature>/
  -> API route validates and delegates to lib/features/<feature>/
  -> lib/features/<feature>/ writes or reads Prisma through @/lib/core/db
  -> client updates state and shows localized feedback
```

LLM-aware features often add:

```text
lib/ai/context/<feature>.slot.ts
lib/ai/tools/registry/<feature>.registry.ts
lib/ai/tools/handlers/<feature>.handler.ts
```

## Placement Rules

- New route or screen: start in `app/(app)/<feature>/page.tsx`, then render a client shell from `components/<feature>/`.
- New mutation endpoint: add it under `app/api/<feature>/`, keep the route thin, and delegate to `lib/features/<feature>/`.
- New business rule: put it in `lib/features/<feature>/`.
- New client interaction pattern: put hook/helper code under `components/<feature>/logic/`.
- New shared project UI: put it in `components/shared/`.
- New shadcn primitive: add it through shadcn tooling into `components/ui/`.
- New DB shape: update `prisma/schema.prisma`, migration/generated client, related types, logic, and docs as needed.
- New user-facing copy: add keys to both message files.

## Check Before Creating Folders

Feature names are mostly consistent across `app/`, `components/`, `lib/`, and `app/api/`, but verify the existing repo before creating a new folder. Some established names may be singular or domain-specific. Follow the live code unless there is a deliberate refactor.

When in doubt, search for the closest existing feature and mirror its layer placement.
