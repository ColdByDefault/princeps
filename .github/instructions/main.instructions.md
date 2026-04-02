---
description: "High-level repo architecture, layer responsibilities, and cross-cutting rules for See-Sweet."
name: "See-Sweet Repo Overview"
---

# See-Sweet Repo Overview

## Product Intent

- See-Sweet is a private executive secretariat, not a generic chatbot.
- Prioritize workflows around preparation, memory, decisions, coordination, and follow-through.
- Favor features that increase user leverage inside a personal authenticated workspace.
- Core shape: user-scoped data, retrieval-backed assistant, configurable behavior, multilingual UI (German default + English), structured workspace flows.

## Repository Layers

### Pages & Layouts — `app/`

- App Router pages, layouts, metadata, and route-group boundaries.
- Server pages handle auth, data fetching, and pass serialized props to client components.
- API route handlers live in `app/api/<feature>/` and stay thin — auth, parse, delegate, respond.

### Components — `components/`

- `components/<feature>/` — interactive UI scoped to one feature. Always includes an `index.ts` barrel exporting all public members.
- `components/<feature>/logic/` — client-side hooks, state management, API call handlers, and data transforms. Component `.tsx` files stay focused on JSX rendering and delegate behavior to hooks and helpers in `logic/`.
- `components/ui/` — Shadcn UI primitives only. Added via `npx shadcn@latest add <component>`. Never edit source files in this folder.
- `components/shared/` — cross-feature project-level UI (NoticePanel, ConfirmDialog, FloatingNotices, etc.). Not Shadcn — those go in `ui/`.

### Server Logic — `lib/<feature>/`

- One file per operation: `create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`.
- `shared.logic.ts` — Prisma includes, DB→client shape mapping (`toXxxRecord()`).
- `schemas.ts` — Zod validators for create and update inputs.
- Business rules live here, not in route handlers or components.

### Tools — `lib/tools/`

- Standalone orchestration layer, not owned by any feature.
- `registry.ts` — tool definitions in OpenAI function-calling schema format.
- `executor.ts` — `executeToolCall(userId, toolCall)` dispatcher. Resolves names→IDs, deduplicates, delegates to `lib/<feature>/` logic, returns structured results.
- `resolvers.ts` — shared name→ID resolution helpers (contacts by name, labels by name with auto-create).
- Any surface can invoke tools: chat, cron, webhooks, future agents.

### LLM Provider — `lib/llm/`

- Provider abstraction for LLM calls (chat completions, embeddings).
- OpenAI is the primary provider. Abstraction supports adding alternatives without changing consumers.
- Exposes `callChat()`, `streamChat()`, `embed()`.
- Tool schemas from `lib/tools/registry.ts` are passed to the provider — the provider does not own them.

### Context Assembly — `lib/context/`

- Builds the system prompt from user preferences, personal info, and feature data slots.
- Each slot (`tasks.slot.ts`, `meetings.slot.ts`, etc.) retrieves and formats one data section.
- Output is a complete system message ready for the LLM provider.
- Context assembly is consumed by chat streaming, but lives outside `lib/chat/`.

### Chat — `lib/chat/`

- Just another feature. Handles message persistence, streaming orchestration, and conversation history.
- Consumes `lib/llm/` for LLM calls, `lib/tools/` for tool execution, `lib/context/` for prompt assembly.
- Does not own tool definitions, LLM provider logic, or context construction.

### Types — `types/`

- Shared client-safe contracts, record shapes, and enums.
- Must not import server-only modules.

### i18n — `messages/`, `i18n/`

- `next-intl` with middleware-based locale detection.
- `messages/de.json` and `messages/en.json` — flat, namespaced keys (`feature.section.item`).
- German is the default locale. English is the second locale.

### Database — `prisma/`

- Schema, migrations, and seed scripts.
- Generated Prisma client output in `lib/generated/prisma`.
- Import Prisma only from `@/lib/db`.

## Core Constraints

- All data access is user-scoped. Filter by `userId` unless the code is intentionally admin-only.
- Keep Prisma, pgvector, Better Auth server helpers, and LLM provider calls server-only. Use `import "server-only"` on any module that must never reach client bundles.
- The LLM assistant is aware of all user data and all implemented features. When a user creates a meeting, uploads a knowledge file, or does anything else, the assistant can reason about that data.
- Keep technical text, logs, and validation errors in English. In-app notices (success, error, etc.) are localized.
