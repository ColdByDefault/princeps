---
description: "Full-stack Princeps feature implementation checklist: data model, types, server logic, API routes, UI, i18n, tools, context, tiers, settings, notifications, docs, and validation."
name: "Princeps Feature Implementation"
applyTo: "app/**/*,components/**/*,lib/**/*,types/**,prisma/**,messages/**"
---

# Princeps Feature Implementation

Use this file when adding or substantially changing a Princeps feature. For small focused edits, apply only the relevant scoped instruction file.

Read first:

- `CONTEXT/11_NEW_FEAT_Impl.md`
- `CONTEXT/03_BACKEND_STRUC.md`
- `CONTEXT/04_FRONTEND_&_i18n_STRUC.md`
- `CONTEXT/06_LLM_TOOLS.md` when adding tools
- `CONTEXT/07_TIER_SYS.md` when adding quotas or paid actions
- `CONTEXT/09_APP_SETTINGS.md` when adding settings
- `CONTEXT/10_NOTIFICATION_STRUC.md` when adding notifications

Also apply:

- `.github/instructions/backend/server-data.instructions.md` for API, server logic, Prisma, auth, validation, rate limits, tiers, and server-only boundaries.
- `.github/instructions/frontend/frontend.instructions.md` for pages, components, UI, hydration, Base UI, shadcn, and feedback.
- `.github/instructions/i18n/i18n.instructions.md` for localized copy and message files.

Do not implement from docs or context alone. Verify the current code before editing. Prefer live references: `tasks` for complete CRUD, `contacts` for relationship records and duplicate checks, and `meetings` for linked records, integrations, AI prep packs, tier gates, and token usage.

## Feature Scope

A complete feature may touch:

```text
prisma/schema.prisma
types/api.ts
lib/features/<feature>/
app/api/<feature>/
app/(app)/<feature>/page.tsx
components/<feature>/
messages/de.json
messages/en.json
lib/ai/tools/registry/<feature>.registry.ts
lib/ai/tools/handlers/<feature>.handler.ts
lib/ai/context/<feature>.slot.ts
lib/platform/tiers/
lib/platform/settings/
lib/features/notifications/
components/navigation/
docs/
CONTEXT/
```

Only add layers the feature actually needs, but check every layer before calling the feature done.

## Standard Shape

Normal CRUD-style features follow this shape:

```text
app/(app)/<feature>/page.tsx
components/<feature>/
  index.ts
  <Feature>Shell.tsx
  <Feature>Card.tsx
  Create<Feature>Dialog.tsx
  Edit<Feature>Dialog.tsx
  logic/use<Feature>Mutations.ts
lib/features/<feature>/
  index.ts
  schemas.ts
  shared.logic.ts
  create.logic.ts
  list.logic.ts
  update.logic.ts
  delete.logic.ts
app/api/<feature>/route.ts
app/api/<feature>/[id]/route.ts
```

Knowledge, integrations, voice, imports, and other pipeline features may legitimately diverge. Do not force them into CRUD when the domain shape is different.

## Build Order

### 1. Scope And References

- Confirm which authenticated `userId` owns the data.
- Pick the closest live reference feature before creating new patterns.
- Decide whether the feature needs storage, UI, API, tools, context, tier gates, settings, notifications, integrations, docs, or `CONTEXT/` updates.

### 2. Data Model

- Add or update `prisma/schema.prisma` when the feature stores data.
- User-owned models include `userId`, a `User` relation, and useful `@@index` entries.
- Use Prisma enums for fixed states such as status, priority, or lifecycle.
- Use join tables for labels or many-to-many links.
- After schema changes, update migrations and regenerate the Prisma client.
- Do not edit generated files in `prisma/generated/prisma/`.

### 3. Client-Safe Types

- Add or update record contracts in `types/api.ts`.
- Use ISO strings for dates.
- Flatten joins into arrays such as `labels`, `participants`, `tasks`, or `goals`.
- Do not expose secrets, provider tokens, raw Prisma rows, or internal ownership fields unless intentionally needed.

### 4. Server Logic

- Put validation, DB access, mapping, side effects, and ownership checks in `lib/features/<feature>/`.
- Public logic functions accept `userId` from the caller.
- All user-owned queries and mutations filter by `userId`.
- `shared.logic.ts` owns Prisma `select`/`include` and DB-row to client-record mapping.
- Operation files stay focused: create, list, update, delete.
- Server-only modules start with `import "server-only"` when they import Prisma, auth helpers, LLM providers, Stripe, pgvector/raw SQL, Node APIs, or tokens.

### 5. API Routes

- API routes stay thin: authenticate, rate-limit or tier-gate when needed, parse as `unknown`, validate with Zod, delegate to `lib/features/<feature>/`, and respond.
- Routes must not contain business logic, direct Prisma queries, raw SQL, reusable transforms, or LLM calls.
- Use standard status codes: `401`, `400`, `403`, `404`, `409`, `429`, `500`, `502`, plus `201` for creates and `204` for successful deletes.
- Error response shape is `{ error: string }`.

### 6. Server Page And UI

- Server pages authenticate, generate localized metadata, fetch initial user-scoped data, and render the client shell.
- Feature shells own list state, filters, selected edit/delete target, refresh state, dialogs, and delete confirmation.
- Cards render one record and raise events to the shell.
- Create and edit dialogs are separate components unless the domain has a strong reason otherwise.
- Mutation hooks in `components/<feature>/logic/` own API calls, loading flags, local state updates, and toast/notice feedback.
- Component `.tsx` files focus on JSX and composition.

### 7. i18n And Navigation

- Add every user-facing string to both `messages/de.json` and `messages/en.json`.
- Keep `common` as the first top-level namespace in both locale files.
- Put generic reusable labels in `common.*` first (for example actions, states, entities, fields, filters, and status labels).
- Keep feature/domain-specific copy under feature namespaces.
- Prefer reusing `common.*` over adding duplicate feature-local keys.
- Use `useTranslations("<feature>")` in client components and `getTranslations("<feature>")` in server code.
- Add navigation only when the feature has a first-class page.
- Add nav labels to both message files.

### 8. LLM Tools

Add tools only when the assistant should act on the feature.

Current live layout:

```text
lib/ai/tools/registry/<feature>.registry.ts
lib/ai/tools/registry.ts
lib/ai/tools/handlers/<feature>.handler.ts
lib/ai/tools/executor.ts
```

Rules:

- Registry files define OpenAI-compatible schemas with `minTier`, `group`, stable snake_case names, descriptions, and parameters.
- `lib/ai/tools/registry.ts` only imports and spreads feature registry entries.
- Handlers validate untrusted args, resolve names to IDs, prevent likely duplicates, enforce tier gates, delegate to `lib/features/<feature>/`, and return compact `ActionResult` data.
- `lib/ai/tools/executor.ts` only imports and spreads handler maps.
- Tool handlers must enforce the same feature-specific gates as API routes.
- Destructive tools require clear user intent or confirmation in their descriptions and assistant behavior.

### 9. LLM Context

Add `lib/ai/context/<feature>.slot.ts` when the assistant should know the feature's live data during conversations.

- Slots fetch compact, user-scoped data.
- Include stable record IDs when later tool calls may need them.
- Return `null` when empty.
- Use the `query` parameter only for relevance or semantic search.
- Register the slot in `SLOT_REGISTRY`.

### 10. LLM Calls

For AI-generated feature content:

- Use `lib/ai/llm-providers/`, not `lib/chat` and not stale `lib/llm/` paths.
- Put prompt assembly in `lib/features/<feature>/`.
- Gate expensive actions before provider calls.
- Catch provider errors and return a user-safe failure.
- Store generated output only after a successful call.
- Update monthly token counters after the call.

### 11. Tiers And Usage

- Decide whether the quota is count-at-rest, daily, monthly, lifetime, or disabled by tier.
- Plan limits live in `types/billing.ts`.
- Enforcement lives in `lib/platform/tiers/enforce.ts`.
- Call gates before writes or expensive work in both API routes and tool handlers.
- Update usage summaries, settings UI, and i18n when the quota is user-facing.
- Do not manually increment count-at-rest quotas; the record count is the usage.

### 12. Notifications, Settings, Integrations

- Add notifications only for meaningful user-facing events.
- Notifications always include `userId` and respect preferences where applicable.
- Store true user preferences in `User.preferences` and save them through the settings flow.
- Do not store usage, integration state, or subscription state in `User.preferences`.
- Keep optional external integrations best-effort unless product behavior requires strict coupling.
- Never expose provider tokens to the client.

### 13. Docs And Context

- Update `CONTEXT/` when an agent-facing architecture map changes or future agents would otherwise rediscover a repeated pattern.
- Update `docs/` when product behavior, setup, billing, integrations, operations, or human-facing architecture docs change.
- Do not update broad unrelated docs when one focused context/doc update is enough.

## Known Exceptions

### Knowledge

Knowledge intentionally diverges from normal CRUD:

- Upload, extraction, embeddings, and search are pipeline behavior.
- `lib/features/knowledge/` has search/import flows rather than the normal create/update/delete shape.
- Context uses the incoming query for semantic search.
- Tools are specialized and should not be forced into ordinary CRUD.

Use this same judgment for future upload-indexed, RAG-backed, integration, voice, or pipeline features.

## Final Checklist

- [ ] Prisma schema and generated client are updated if storage changed.
- [ ] Client-safe types are updated.
- [ ] `lib/features/<feature>/` contains schemas, shared mapper, and focused operation logic.
- [ ] API routes are thin, authenticated, user-scoped, validated, rate-limited, and tier-gated when needed.
- [ ] Server page authenticates, fetches data, and passes serialized props.
- [ ] UI has shell, cards, create/edit dialogs, mutation hook, refresh, delete confirmation, loading states, and feedback when applicable.
- [ ] User-facing strings exist in German and English.
- [ ] Navigation and metadata are added if there is a page.
- [ ] LLM tools are registered and handled if the assistant should act.
- [ ] Context slot is registered if the assistant should know the feature's data.
- [ ] Expensive LLM actions use provider abstraction, tier gates, token counters, and safe error handling.
- [ ] Notifications, settings, integrations, usage, and billing were considered.
- [ ] Docs or `CONTEXT/` are updated for significant behavior.
- [ ] Required copyright headers are present on new server/tool/context/page files.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` pass after a full feature or risky change.
