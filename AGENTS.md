# Princeps — Agent Guide

Princeps is a private executive secretariat / chief-of-staff product. It is not a generic chatbot. Features cover tasks, meetings, contacts, decisions, knowledge, memory, briefings, goals, and reports — all scoped to an authenticated user.

## Stack

- **Framework**: Next.js 15 App Router (TypeScript)
- **Database**: PostgreSQL via Prisma + pgvector
- **Auth**: Better Auth
- **LLM**: OpenAI (via `lib/llm-providers/`)
- **i18n**: next-intl — German default, English second locale
- **UI**: Shadcn UI + Tailwind CSS

## Repository Layout

```
app/(app)/<feature>/page.tsx       Server page — auth, data fetch, pass to client
components/<feature>/              Client components — UI, state, API calls
  index.ts                         Barrel exports
lib/<feature>/                     Server logic
  schemas.ts                       Zod validators
  create.logic.ts / list / update / delete / shared
app/api/<feature>/                 API routes — thin handlers only
lib/tools/                         Tool orchestration (feature-agnostic)
  registry.ts                      OpenAI function-calling schemas
  executor.ts                      Dispatcher — never modified for new features
  handlers/<feature>.handler.ts    One file per feature
lib/llm-providers/                 LLM provider abstraction
lib/context/                       System prompt assembly (slots per feature)
messages/de.json + en.json         All user-facing strings
prisma/schema.prisma               Single schema, migrations in prisma/migrations/
```

## Key Rules

- **Server/client boundary**: Prisma, Better Auth server helpers, LLM calls, and pgvector are server-only. Add `import "server-only"` to modules that must never reach client bundles. No client import chain may reach `@/lib/db`.
- **User-scoped data**: All queries filter by `userId` unless explicitly admin-only.
- **i18n**: Never hardcode user-facing copy. In-app notices (success, error, etc.) are localized. Logs and validation errors stay in English.
- **Tools layer**: Tools are standalone — not owned by chat. Any surface (chat, cron, webhooks) can call `executor.ts`. Adding a new feature's tools = create `handlers/<feature>.handler.ts` and spread into `HANDLERS` in `executor.ts`.
- **API routes**: Thin — authenticate, parse, delegate to `lib/<feature>/`, respond. No business logic.
- **Components**: Logic (hooks, transforms, API calls) lives in `components/<feature>/logic/`. `.tsx` files handle JSX only.
- **Docs**: `/docs` is the source of truth for product decisions. Update it when making significant changes.

## Workflow

- Work one task at a time. Stop after each distinct step and wait for approval unless a full pass was requested.
- Edit files one by one.
- Run `npm run lint`, `npm run typecheck`, `npm run build` when a feature is complete or a change is risky — not after every small edit.
- Ask before deleting files, dropping DB tables, force-pushing, or any action that is hard to reverse.