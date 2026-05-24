# 11 - New Feature Implementation

Last updated: 2026-05-07

Read this when building a new Princeps feature or adding LLM tools to an existing feature.

Use these live references:

- `tasks`: clean CRUD feature with labels, goals, tier limits, tools, and context.
- `contact`: simple relationship feature with labels, duplicate detection, tools, and context. The component folder is singular legacy naming; new features should prefer `components/<feature>/`.
- `meetings`: advanced feature with participants, linked tasks, Google Calendar side effects, AI prep packs, tier gates, token usage, tools, and context.

Also read:

- `03_BACKEND_STRUC.md`
- `04_FRONTEND_&_i18n_STRUC.md`
- `06_LLM_TOOLS.md`
- `07_TIER_SYS.md`
- `09_APP_SETTINGS.md`
- `10_NOTIFICATION_STRUC.md`

## Goal

A complete Princeps feature is not just a page. It may touch:

```text
Prisma model
lib/features/<feature>/ server logic
app/api/<feature>/ routes
components/<feature>/ UI
messages/de.json + messages/en.json
types/api.ts
lib/ai/tools/ registry + handler
lib/ai/context/<feature>.slot.ts
lib/platform/tiers/ quota gates
lib/platform/settings/ usage summary or preferences
lib/features/notifications/ or db.notification side effects
docs/ or CONTEXT updates
```

Only add the layers the feature actually needs, but check every layer before declaring the feature done.

## Standard Shape

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

Use this for normal CRUD-style features. Knowledge, integrations, voice, and other pipeline features may legitimately diverge.

## Build Order

### 1. Data Model

Add the Prisma model first when the feature stores data.

Rules:

- Include `userId` and a `User` relation unless the model is truly global.
- Add `@@index([userId])`.
- Add indexes for common filters: foreign keys, status, scheduled dates, dismissed flags, etc.
- Use enums for fixed states like task status, priority, meeting status.
- Use join tables for labels or many-to-many links.
- Use cascade/null behavior intentionally.

Examples:

- `Task` links to `Meeting?` with `onDelete: SetNull`.
- `MeetingParticipant` has `@@unique([meetingId, contactId])`.
- `LabelOnTask`, `LabelOnMeeting`, and `LabelOnContact` use composite IDs.
- `Notification` is soft-deleted with `dismissed`, not hard-deleted by default.

After schema changes:

```text
npx prisma db push
npx prisma generate
restart dev server
```

### 2. Client-Safe Type

Add or update the record type in `types/api.ts`.

The client type should:

- Use ISO strings for dates.
- Include only data the UI/API should expose.
- Flatten joins into simple arrays, e.g. `labels`, `participants`, `tasks`, `goals`.

Reference:

```text
TaskRecord
MeetingRecord
ContactRecord
NotificationRecord
```

### 3. Server Logic

`lib/features/<feature>/` owns validation, DB access, mapping, and side effects.

Files:

```text
schemas.ts        Zod create/update validators
shared.logic.ts   SELECT const + DB row -> client record mapper
list.logic.ts     Query only
create.logic.ts   Insert + create side effects
update.logic.ts   Patch + update side effects
delete.logic.ts   Delete/soft-delete + delete side effects
index.ts          Barrel exports
```

Use `import "server-only"` on modules importing Prisma, auth helpers, LLM providers, pgvector, or other server-only code. Pure `schemas.ts` files do not need DB imports.

Patterns:

- Every query filters by `userId`.
- All public logic functions accept `userId`.
- `shared.logic.ts` centralizes `SELECT` and `toXRecord()`.
- `create.logic.ts` returns a client-safe record.
- `update.logic.ts` returns `{ ok: true, record }` or a typed not-found result.
- `delete.logic.ts` uses `deleteMany`/`updateMany` with `{ id, userId }`.

Good examples:

```text
lib/features/tasks/shared.logic.ts
lib/features/tasks/update.logic.ts
lib/features/contacts/create.logic.ts
lib/features/meetings/update.logic.ts
```

Side effects stay in server logic:

- Meetings push/sync/delete Google Calendar events best-effort.
- Prep packs call the LLM and update token counters.
- Reports create a system notification fire-and-forget.

### 4. API Routes

API routes stay thin:

```text
auth
rate limit writes
tier gate creates/expensive actions
parse body with Zod
delegate to lib/features/<feature>/
return JSON
```

Use:

```ts
auth.api.getSession({ headers: await headers() });
writeRateLimiter;
getRateLimitIdentifier();
createRateLimitResponse();
createTierLimitResponse();
```

Status codes:

- `401` unauthorized.
- `400` validation error.
- `403` plan/tier limit.
- `404` user-scoped record not found.
- `201` create.
- `204` delete with no body.

References:

- `app/api/tasks/route.ts`: basic list/create + `enforceTasksMax`.
- `app/api/contacts/route.ts`: list/create + `enforceContactsMax`.
- `app/api/meetings/[id]/prep-pack/route.ts`: expensive AI action with monthly quota and tool-call quota.

### 5. Frontend

Server page:

```text
app/(app)/<feature>/page.tsx
  -> generateMetadata()
  -> auth
  -> redirect unauthenticated
  -> load initial data in Promise.all()
  -> render <FeatureShell ... />
```

Client components:

- `Shell`: owns list state, filters, selected item, dialogs, refresh, delete confirmation.
- `Card`: renders one record and emits actions.
- `CreateDialog` and `EditDialog`: separate components.
- `logic/use<Feature>Mutations.ts`: API calls, loading state, toasts.
- `index.ts`: barrel exports.

UI rules:

- No hardcoded user-facing strings.
- Use `useTranslations("<feature>")`.
- Every input has a localized placeholder.
- Every non-text control has localized `aria-label`.
- Every clickable control has `cursor-pointer`.
- Icon-only buttons need tooltips unless the existing local pattern clearly handles the label another way.
- Destructive actions use `AlertDialog`.
- User actions show localized success/error/loading feedback.

References:

- `components/tasks/TasksShell.tsx`
- `components/tasks/logic/useTaskMutations.ts`
- `components/meetings/MeetingsShell.tsx`
- `components/contact/ContactsShell.tsx`

## i18n And Navigation

Add all user-facing copy to both:

```text
messages/de.json
messages/en.json
```

Typical namespace:

```text
common.actions.*
common.states.*
common.entities.*
common.fields.*
common.filters.*
common.status.*
common.confirmation.*
<feature>.metadata.*
<feature>.newX
<feature>.empty*
<feature>.fields.*
<feature>.createDialog.*
<feature>.editDialog.*
<feature>.deleteDialog.*
```

Rules:

- Keep `common` as the first top-level namespace in both locale files.
- Reuse `common.*` for generic labels before adding feature-local duplicates.
- Keep feature/domain-specific copy in the feature namespace.

Add navigation only when the feature has a first-class page:

```text
components/navigation/*
messages/*.json shell/nav keys
```

## LLM Tools

Use tools when the assistant should create, update, list, delete, or perform actions for the feature.

Current live layout:

```text
lib/ai/tools/registry/<feature>.registry.ts
lib/ai/tools/registry.ts
lib/ai/tools/handlers/<feature>.handler.ts
lib/ai/tools/executor.ts
```

Add:

1. Tool schema entries in `registry/<feature>.registry.ts`.
2. Import/spread the entries in `lib/ai/tools/registry.ts`.
3. Handler functions in `handlers/<feature>.handler.ts`.
4. Import/spread the handler map in `lib/ai/tools/executor.ts`.

Do not add business logic to `executor.ts`. It only dispatches and checks active tools.

Every tool registry entry needs:

```text
minTier
group
type: "function"
function.name
function.description
function.parameters
```

Reference patterns:

- `taskTools`: free CRUD tools, duplicate-aware create, labels by name.
- `contactTools`: create/list/update/delete with duplicate detection.
- `meetingTools`: free meeting CRUD plus Pro prep-pack tools.

Handler rules:

- Validate LLM args with the same Zod schemas used by API routes.
- Resolve friendly names to IDs in handlers, not schema files.
- Use `resolveOrCreateLabelIdsByNames()` for label names.
- Check tier limits in create/expensive handlers.
- Return `{ ok: true, data }` or `{ ok: false, error }`.
- Confirm destructive intent in the tool description and system prompt behavior. The handler should still verify ownership.

The chat stream enforces monthly tool-call quota before executing tool calls. Feature handlers still enforce feature-specific quotas.

## LLM Awareness

If the LLM should know about the feature's live data, add a context slot:

```text
lib/ai/context/<feature>.slot.ts
lib/ai/context/index.ts
```

Slot pattern:

```ts
export const featureSlot: ContextSlot = {
  key: "feature",
  label: "Feature",
  async fetch(userId, query) {
    const records = await listFeatures(userId);
    if (records.length === 0) return null;
    return records.map((r) => `- [${r.id}] ${r.title}`).join("\n");
  },
};
```

Rules:

- Keep slots compact. The whole result goes into every chat system prompt.
- Include stable record IDs when the LLM may need tool calls later.
- Return `null` when empty.
- Use the `query` parameter only when relevance search is needed.
- Register in `SLOT_REGISTRY`; `buildSystemPrompt()` does the rest.

References:

- `tasks.slot.ts`: active tasks only, priority/due/goals.
- `contacts.slot.ts`: contacts plus meeting history.
- `meetings.slot.ts`: upcoming meetings, participants, linked tasks, prep-pack status.

## LLM Calls

Use `lib/ai/llm-providers/provider.ts`, not `lib/chat` and not the stale `lib/llm/` path from older instructions.

```ts
import { callChat } from "@/lib/ai/llm-providers/provider";
```

For AI-generated feature content:

- Put prompt assembly in `lib/features/<feature>/`.
- Gate expensive actions before the call.
- Catch provider errors and return a user-safe failure.
- Store generated output only after a successful call.
- Update monthly token counters after the call.
- Keep provider-specific logic out of feature code.

Reference:

```text
lib/features/meetings/generate-prep-pack.logic.ts
lib/features/briefings/generate.logic.ts
lib/features/notifications/greeting.logic.ts
```

## Tier System And Usage

Decide which quota type applies.

Count-at-rest limits:

```text
contactsMax -> enforceContactsMax()
tasksMax    -> enforceTasksMax()
meetingsMax -> enforceMeetingsMax()
```

Monthly action counters:

```text
prepPacksPerMonth -> enforcePrepPackMonthly()
briefingsPerMonth -> enforceBriefingMonthly()
toolCallsPerMonth -> enforceToolCallsMonthly()
messages/tokens   -> enforceMonthlyLimits() + accumulateTokens()
```

For a new quota:

1. Add limit fields to `PlanLimits` and `PLAN_LIMITS` in `types/billing.ts`.
2. Add counter fields to `UsageCounter` only if it is not count-at-rest.
3. Add an enforce function in `lib/platform/tiers/enforce.ts`.
4. Export from `lib/platform/tiers/index.ts`.
5. Call it in API routes and tool handlers.
6. Add usage fields to `UsageSummary`.
7. Read them in `lib/platform/settings/usage.logic.ts`.
8. Show them in `UsageTab` if user-facing.
9. Add i18n keys.

Do not increment count-at-rest quotas manually. The record count is the usage.

## Notifications And Reports

Only add notifications when there is a real user-facing event.

Options:

- Use `lib/features/notifications/` for reusable notification generation flows.
- Use `db.notification.create()` fire-and-forget for simple feature-owned notices.
- Use `createReport()` when the notification belongs to an assistant tool report.

Notification rules:

- Always include `userId`.
- Pick a stable `category`.
- Use `source: "assistant"` for assistant/proactive messages, `source: "system"` for app notices.
- Use `metadata` for small structured details.
- Respect `notificationsEnabled !== false` for proactive assistant messages.
- Use daily/idempotency checks for cron-generated notifications.
- Dispatch `notifications:refresh` from active chat surfaces when tool execution creates server-side notices.

References:

- `lib/features/notifications/greeting.logic.ts`
- `lib/features/notifications/nudge-overdue.logic.ts`
- `lib/features/reports/create.logic.ts`

## Settings And Preferences

If the feature adds a user setting:

- Store true preferences in `User.preferences`.
- Use `PATCH /api/settings` for settings tabs.
- Parse/save in `lib/platform/settings/user-preferences.logic.ts`.
- Pass from `app/(app)/settings/page.tsx` through `SettingsShell`.
- Add UI under the owning settings tab.
- Add strings to both locales.
- Wire the setting into the consumer.

Do not store usage, integration state, or subscription state in `User.preferences`.

## Integrations And External Side Effects

Keep external systems best-effort unless the feature explicitly requires strict coupling.

Meeting references:

- `createMeeting()` creates the Princeps meeting first, then optionally pushes to Google Calendar.
- `updateMeeting()` updates Princeps first, then best-effort syncs Google Calendar.
- `deleteMeeting()` deletes Princeps first, then best-effort deletes Google Calendar event.

Never let a failed optional integration roll back the user's local data unless the product behavior explicitly says it must.

## Reference Feature Map

Tasks:

```text
app/(app)/tasks/page.tsx
app/api/tasks/*
lib/features/tasks/*
components/tasks/*
lib/ai/tools/registry/tasks.registry.ts
lib/ai/tools/handlers/tasks.handler.ts
lib/ai/context/tasks.slot.ts
```

Use Tasks for basic CRUD, filters, labels, goals, rate limits, tier gates, and LLM CRUD tools.

Contacts:

```text
app/(app)/contacts/page.tsx
app/api/contacts/*
lib/features/contacts/*
components/contact/*
lib/ai/tools/registry/contacts.registry.ts
lib/ai/tools/handlers/contacts.handler.ts
lib/ai/context/contacts.slot.ts
```

Use Contacts for relationship records, duplicate detection, labels, and cross-feature context.

Meetings:

```text
app/(app)/meetings/page.tsx
app/api/meetings/*
lib/features/meetings/*
components/meetings/*
lib/ai/tools/registry/meetings.registry.ts
lib/ai/tools/handlers/meetings.handler.ts
lib/ai/context/meetings.slot.ts
```

Use Meetings for advanced features: linked contacts/tasks, integration side effects, AI-generated prep packs, Pro tools, monthly counters, and token accumulation.

## Final Checklist

- Prisma schema, generated client, and client-safe type are updated.
- `lib/features/<feature>/` has schemas, shared mapper, list/create/update/delete logic.
- API routes are thin, authenticated, rate-limited, user-scoped, validated, and tier-gated when needed.
- UI has shell, cards, dialogs, mutation hook, refresh, delete confirmation, loading states, and toasts.
- All user-facing strings exist in German and English.
- Navigation and metadata are added if there is a page.
- LLM tools are registered and handled if the assistant should act on the feature.
- Context slot is registered if the assistant should know about the feature's data.
- Expensive LLM actions use provider abstraction, tier gates, token counters, and safe error handling.
- Notifications/reports are added only when useful and respect preferences where appropriate.
- Settings/usage UI is updated if new preferences or quotas were introduced.
- Docs or `CONTEXT/` are updated for significant behavior.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` after a full feature or risky change.
