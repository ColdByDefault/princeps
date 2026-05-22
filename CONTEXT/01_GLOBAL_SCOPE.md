# 01 - Global Scope

Last updated: 2026-05-07

Read this first. This file is the orientation compass for agents: what Princeps is, what it is not, which sources to trust, and which rules apply everywhere. Detailed structure belongs in the later `CONTEXT/` files and `.github/instructions/`.

## Product Identity

Princeps is a private executive secretariat and chief-of-staff workspace for an authenticated individual user.

It gives one person operational leverage across preparation, memory, coordination, decisions, follow-through, briefings, and context-aware assistance. The assistant is valuable because it reasons over the user's real workspace state, not only the current chat.

Princeps is not:

- A generic chatbot or prompt playground.
- A standalone CRM, task app, calendar app, or document vault.
- A team collaboration or social-login product by default.
- An admin-first platform.

Every meaningful feature should help the user prepare, remember, coordinate, decide, follow through, or understand their own workspace.

## User Scope

- The core actor is an authenticated `User`.
- Domain data is owned by `userId`.
- Queries, mutations, tools, context slots, settings, quotas, billing state, and integrations must respect user ownership.
- Middleware and `proxy.ts` help routing, but are never the trust boundary. Server pages and API routes authenticate independently.
- External integrations are data connectors, not identity providers. Users sign into Princeps with Better Auth, then connect services separately.

## Stack Snapshot

Use `package.json` and the current code tree when details conflict with older docs.

- Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui, Lucide.
- PostgreSQL through Prisma, with pgvector for knowledge embeddings.
- Better Auth for email/password sessions.
- `next-intl` with German default and English second locale.
- LLM provider abstraction in `lib/ai/llm-providers/` for OpenAI, Ollama, and Groq.
- Stripe for billing, Langfuse for optional production LLM observability, SSE for notification streaming.

Naming note: some `.github` instructions mention `lib/llm/`; the current implementation uses `lib/ai/llm-providers/`.

## Source Of Truth Order

When sources disagree, trust them in this order:

1. Current code, `package.json`, `prisma/schema.prisma`, and migrations.
2. `AGENTS.md` and `.github/copilot-instructions.md`.
3. `.github/instructions/feature.instructions.md`.
4. More specific `.github/instructions/*.instructions.md`.
5. `/docs` for product decisions, implementation notes, known gaps, and planned direction.
6. `README.md` for public overview and onboarding context.

Treat WIP or planned docs as direction, then verify against live code. Update `/docs` when a significant product or architecture decision changes.

## Product Domains

Princeps currently spans:

- Auth, profile, settings, tiers, usage, and billing.
- Chat, LLM provider calls, tools, context assembly, and assistant behavior.
- Knowledge, personal info, memory, and retrieval.
- Tasks, meetings, contacts, decisions, goals, labels, briefings, and reports.
- Notifications, greetings, weather context, proactive nudges, and inbox state.
- External integrations, currently with Google Calendar code and broader provider plans.

## Global Invariants

- All user data access is user-scoped unless explicitly admin-only.
- Server-only code stays server-only: Prisma, Better Auth server helpers, LLM providers, pgvector, Stripe, and Node-only APIs.
- No client import chain may reach `@/lib/core/db`.
- API routes stay thin: authenticate, rate-limit or tier-gate if needed, parse, validate, delegate, respond.
- Business logic lives in `lib/features/<feature>/`, not in route handlers, pages, or JSX components.
- Client component logic lives in `components/<feature>/logic/`; `.tsx` files should focus on rendering.
- Tools are feature-agnostic. Registry and handlers live under `lib/ai/tools/`; chat, cron, webhooks, and future agents can all use the same executor.
- LLM context lives in `lib/ai/context/`; each slot fetches and formats user-scoped workspace data.
- Chat consumes providers, tools, and context. It does not own them.
- User-facing UI copy goes in both `messages/de.json` and `messages/en.json`.
- Logs, validation details, and technical errors stay in English; in-app notices are localized.
- Tier and usage gates run before writes or expensive LLM/tool actions.

## Agent Rules

- Read relevant files before editing.
- Work one task at a time and edit files one by one.
- Preserve user changes already present in the worktree.
- Use existing project patterns before inventing new abstractions.
- Ask before deleting files, dropping tables, force-pushing, resetting, or doing anything hard to reverse.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` when a feature is complete or a change is risky.

## Scope Check

Before implementing new work, ask:

1. Which authenticated user owns this data?
2. Which existing feature pattern is closest?
3. Does it need a context slot, LLM tool, tier gate, notification, or docs update?
4. What copy must be localized in German and English?
5. What must remain server-only?

If the answer does not fit Princeps' executive-secretariat scope, narrow the request until it does.
