---
description: "Global workspace rules for See-Sweet: product direction, architecture principles, layer boundaries, and workflow rules. Always active."
name: "See-Sweet Workspace"
applyTo: "**"
---

# See-Sweet Workspace Instructions

## Product Direction

- See-Sweet is a private executive secretariat / chief-of-staff product — the digital equivalent of the support structure used by major CEOs, adapted for an individual user.
- The product helps users stay organized across tasks, meetings, contacts, decisions, knowledge retrieval, and system behavior. It is not a generic chatbot or prompt box.
- Core shape: authenticated workspace, user-scoped data, retrieval-backed assistant, configurable behavior, multilingual UI (German default + English).

## Architecture Principles

### Feature-based structure

Every domain feature (meetings, tasks, contacts, decisions, knowledge, etc.) follows the same layered pattern:

```
app/(app)/<feature>/page.tsx          Server page — auth, data fetch, pass to client
components/<feature>/                  Client components — UI, state, API calls
  index.ts                             Barrel exports
lib/<feature>/                         Server logic — one file per operation
  schemas.ts                           Zod validators
  create.logic.ts                      Insert + side effects
  list.logic.ts                        Query
  update.logic.ts                      Patch + side effects
  delete.logic.ts                      Cascade delete
  shared.logic.ts                      DB→client shape mapping, shared includes
app/api/<feature>/                     API routes — thin handlers that delegate to lib/
```

### Tools are a standalone layer, not owned by chat, or any other feature

```
lib/tools/                             Orchestration layer — feature-agnostic
  registry.ts                          Tool definitions (OpenAI function-calling schemas)
  executor.ts                          executeToolCall() dispatcher
  resolvers.ts                         Shared name→ID resolution (contacts, labels)
```

- Any surface can execute tools: chat, cron, webhooks, future agents.
- Chat is just another feature that talks to the LLM and passes tool calls to `lib/tools/`.
- Adding a new tool never requires touching chat code.

### LLM integration

- OpenAI is the primary provider. The provider layer supports abstraction for future alternatives.
- Provider code lives in `lib/llm/` (not `lib/chat/`). Chat consumes the LLM provider, it does not own it.
- Tool schemas use the OpenAI function-calling format natively.
- Context assembly (system prompt, user data slots) lives in `lib/context/`.

### Server / client boundary

- Prisma, Better Auth server helpers, LLM provider calls, and pgvector access are server-only.
- Add `import "server-only"` to any module that must never reach client bundles.
- Never let a client import chain reach `@/lib/db`.

### i18n

- Uses `next-intl` with middleware-based locale detection.
- German is the default locale. English is the second locale.
- Do not hardcode user-facing copy. Every UI string goes in `messages/de.json` and `messages/en.json`.
- Technical text, logs, and validation errors stay in English, not the in-app popups/notices (Success, error, etc.) they should be translated.

## Workflow Rules

- Work on one task at a time.
- After finishing a distinct task or step, stop and wait for user approval before starting the next one — unless the user explicitly asked for a full multi-step pass.
- Create or edit files one by one. Do not generate many new files in a single burst.
- Ask clarifying questions when scope, acceptance criteria, or behavior is unclear.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` when a task or feature is complete, or when a change is risky. Not after every small edit.
- `/docs` is the source of truth for product decisions, scope, and implementation notes. Update docs when making changes.
