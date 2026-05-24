---
applyTo: "**"
---

# Princeps Workspace Instructions

## Product Direction

- Princeps is a private executive secretariat / chief-of-staff product — the digital equivalent of the support structure used by major CEOs, adapted for an individual user.
- The product helps users stay organized across tasks, meetings, contacts, decisions, knowledge retrieval, and system behavior. It is not a generic chatbot or prompt box.
- Core shape: authenticated workspace, user-scoped data, retrieval-backed assistant, configurable behavior, multilingual UI (German default + English).

## First Reads And Source Order

For non-trivial work, orient in this order:

1. `AGENTS.md`
2. `CONTEXT/00_AGENTS.md`
3. `CONTEXT/01_GLOBAL_SCOPE.md`
4. `CONTEXT/02_GLOBAL_STRUC.md`
5. The relevant layer or feature file in `CONTEXT/`
6. Relevant live code
7. Matching `.github/instructions/**/*.instructions.md`
8. Relevant `docs/` wiki file when product behavior, setup, integrations, billing, or architecture decisions matter

Do not implement from docs or context alone. Current code, `package.json`, `prisma/schema.prisma`, and migrations are final for implementation details. `CONTEXT/` is the compact agent map. `/docs` is the human wiki for product decisions, developer manuals, setup, integrations, billing, and known gaps.

When sources disagree, trust live code for current behavior and call out the mismatch if it matters. Update `CONTEXT/` when an agent-facing architecture map changes. Update `/docs` when product behavior, setup, integrations, billing, or human-facing architecture docs change.

## Architecture Principles

### Feature-based structure

Every domain feature (meetings, tasks, contacts, decisions, knowledge, etc.) follows the same layered pattern:

```
app/(app)/<feature>/page.tsx          Server page — auth, data fetch, pass to client
components/<feature>/                  Client components — UI, state, API calls
  index.ts                             Barrel exports
  logic/                               Client hooks, API calls, transforms
lib/features/<feature>/                         Server logic — one file per operation
  schemas.ts                           Zod validators
  create.logic.ts                      Insert + side effects
  list.logic.ts                        Query
  update.logic.ts                      Patch + side effects
  delete.logic.ts                      Cascade delete
  shared.logic.ts                      DB→client shape mapping, shared includes
app/api/<feature>/                     API routes — thin handlers that delegate to lib/
lib/ai/context/<feature>.slot.ts          LLM system-prompt context slot when needed
lib/ai/tools/registry/<feature>.registry.ts Tool schemas when assistant action is needed
lib/ai/tools/handlers/<feature>.handler.ts Tool handler logic when assistant action is needed
```

### Tools are a standalone layer, not owned by chat, or any other feature

```
lib/ai/tools/                             Orchestration layer — feature-agnostic
  registry.ts                          Imports/spreads feature registries, tier filtering
  registry/
    tasks.registry.ts                  Feature-owned OpenAI function schemas
    <feature>.registry.ts              One file per tool-capable feature
  types.ts                             ActionResult + ToolHandler shared types
  executor.ts                          Thin dispatcher — imports/spreads handlers, calls by name
  resolvers.ts                         Shared name→ID resolution (contacts, labels)
  handlers/
    tasks.handler.ts                   All task tool logic
    labels.handler.ts                  All label tool logic
    <feature>.handler.ts               One file per feature domain
```

- Any surface can execute tools: chat, cron, webhooks, future agents.
- Chat is just another feature that talks to the LLM and passes tool calls to `lib/ai/tools/`.
- Adding a new feature's tools = create `registry/<feature>.registry.ts` and `handlers/<feature>.handler.ts`, then spread the registry and handler maps into the orchestration files. Do not put feature business logic in `registry.ts` or `executor.ts`.
- Tool handlers validate arguments, resolve names to IDs, enforce tier/usage gates, and delegate to `lib/features/<feature>/`.

### LLM integration

- OpenAI is the primary provider. Ollama and Groq are also wired through the provider abstraction where supported.
- Provider code lives in `lib/ai/llm-providers/` (not `lib/features/chat/`). Chat consumes the LLM provider, it does not own it.
- Tool schemas use the OpenAI function-calling format natively.
- Context assembly (system prompt, user data slots) lives in `lib/ai/context/`.

### Server / client boundary

- Prisma, Better Auth server helpers, LLM provider calls, and pgvector access are server-only.
- Add `import "server-only"` to any module that must never reach client bundles.
- Never let a client import chain reach `@/lib/core/db`.

### i18n

- Uses `next-intl` with middleware-based locale detection.
- German is the default locale. English is the second locale.
- Do not hardcode user-facing copy. Every UI string goes in `messages/de.json` and `messages/en.json`.
- Keep `common` as the first top-level namespace in both locale files.
- Put reusable generic labels in `common.*` first (actions, states, entities, fields, filters, status, confirmation).
- Keep feature-specific copy in feature namespaces, and avoid duplicating generic labels there.
- Technical text, logs, and validation errors stay in English. In-app notices, buttons, labels, placeholders, empty states, tooltips, and other user-facing text are localized.

### UI and component rules

- Component `.tsx` files focus on JSX rendering. Move client hooks, mutation state, API calls, and transforms into `components/<feature>/logic/`.
- Every button or clickable element has `cursor-pointer`.
- Every non-text interactive control has a localized `aria-label`.
- Every input has a localized `placeholder`.
- Icon-only controls have tooltips.
- Destructive actions use a confirmation dialog.
- Use Base UI `render` props for triggers. Do not nest a `<Button>` inside another trigger button.
- Do not edit shadcn source files in `components/ui/` unless explicitly approved.

## Workflow Rules

- Work on one task at a time.
- After finishing a distinct task or step, stop and wait for user approval before starting the next one — unless the user explicitly asked for a full multi-step pass.
- Create or edit files one by one. Do not generate many new files in a single burst.
- Ask clarifying questions when scope, acceptance criteria, or behavior is unclear.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` when a task or feature is complete, or when a change is risky. Not after every small edit.
- Preserve user changes already present in the worktree.
- Ask before deleting files, dropping tables, force-pushing, resetting, or doing anything hard to reverse.
