# Features Reference

Last updated: 2026-05-07

This is a quick map of what each Princeps feature does and where to look first.

## Auth And Profile

Purpose:

- Email/password login, username support, sessions, forgot/reset password, profile identity.

Key files:

```text
lib/auth/
components/auth/
app/api/auth/[...all]/route.ts
app/api/dev/reset-links/route.ts
app/(app)/(auth)/
app/(app)/profile/
```

Development password reset links are logged and exposed through `/api/dev/reset-links` only when `NODE_ENV=development`.

## Settings

Purpose:

- User control center for appearance, assistant behavior, tools, usage, provider health, integrations, and subscription.

Key files:

```text
app/(app)/settings/page.tsx
app/api/settings/
components/settings/
lib/settings/
messages/de.json
messages/en.json
```

Most preferences live in `User.preferences`. Timezone and tier are direct `User` fields.

## Chat And Assistant

Purpose:

- Multi-conversation streaming assistant grounded in live workspace context.

Key files:

```text
app/(app)/chat/
app/api/chat/
components/chat/
components/chat-widget/
lib/chat/
lib/context/
lib/tools/
lib/llm-providers/
```

The assistant sees context slots and tier-filtered tools. Chat does not own tools or context; it consumes them.

Meeting recap intake is handled through the existing tool layer: the assistant checks/reuses existing records, creates missing contacts/labels/meetings/decisions/goals/tasks/memory entries, then links them with participants, `meetingId`, task-goal links, and shared labels. Chat and widget chat allow multiple tool rounds so returned IDs can be reused in later linking calls.

## Knowledge

Purpose:

- Upload documents, parse text, chunk, embed, search, and inject relevant chunks into assistant context.

Key files:

```text
app/(app)/knowledge/
app/api/knowledge/
components/knowledge/
lib/knowledge/
lib/context/knowledge.slot.ts
lib/tools/registry/knowledge.registry.ts
```

Manual uploads and Drive imports both enforce knowledge quotas. Raw uploaded files are not stored.

## Tasks

Purpose:

- Track work with title, notes, status, priority, due date, labels, meeting links, and goal links.

Key files:

```text
app/(app)/tasks/
app/api/tasks/
components/tasks/
lib/tasks/
lib/tools/registry/tasks.registry.ts
lib/tools/handlers/tasks.handler.ts
lib/context/tasks.slot.ts
```

Tasks are the cleanest reference for CRUD, labels, tier caps, LLM tools, and context.

## Meetings

Purpose:

- Manage meetings and appointments with participants, agenda, summary, prep packs, linked tasks, labels, and Calendar sync.

Key files:

```text
app/(app)/meetings/
app/api/meetings/
components/meetings/
lib/meetings/
lib/integrations/google-calendar/
lib/context/meetings.slot.ts
```

Prep packs are AI-generated and quota-gated. Google Calendar side effects are best-effort.

## Contacts

Purpose:

- Store people, roles, companies, communication details, notes, labels, and interaction history.

Key files:

```text
app/(app)/contacts/
app/api/contacts/
components/contact/
lib/contacts/
lib/tools/registry/contacts.registry.ts
lib/context/contacts.slot.ts
```

The component folder is singular legacy naming. New features should prefer `components/<feature>/`.

## Decisions, Goals, Labels, Memory

Purpose:

- Decisions capture choices and rationale.
- Goals organize larger work.
- Labels classify records across features.
- Memory stores durable assistant facts.

Key files:

```text
app/(app)/decisions/     lib/decisions/
app/(app)/goals/         lib/goals/
app/(app)/labels/        lib/labels/
app/(app)/memory/        lib/memory/
lib/tools/registry/
lib/context/
```

These features are LLM-aware and may have tier gates.

## Briefings And Reports

Purpose:

- Briefings summarize current work.
- Reports record assistant/tool activity and can create system notifications.

Key files:

```text
app/(app)/briefings/     lib/briefings/
app/(app)/reports/       lib/reports/
components/briefings/
components/reports/
lib/tools/registry/briefings.registry.ts
```

Briefings consume LLM quota. Reports are useful for audit and assistant transparency.

## Notifications And Weather

Purpose:

- Persistent assistant inbox, daily greetings, overdue-task nudges, system notices, and weather context.

Key files:

```text
app/api/notifications/
app/api/cron/tasks-overdue/route.ts
components/notifications/
hooks/use-notifications.ts
lib/notifications/
lib/weather/
```

Notifications are soft-deleted with `dismissed`. Greetings are once per UTC day unless `FORCE_GREETING=true`.

## Integrations

Purpose:

- Connect external services as user-scoped data sources.

Key files:

```text
app/api/integrations/
components/settings/IntegrationsTab.tsx
components/settings/IntegrationCard.tsx
lib/integrations/
prisma/schema.prisma
```

Current providers are Google Calendar and Google Drive. Future providers should use stable provider strings and provider-owned folders.

## Tiers And Subscription

Purpose:

- Enforce usage limits and sync paid plan state.

Key files:

```text
types/billing.ts
lib/tiers/
lib/stripe/
app/api/stripe/
components/pricing/
components/settings/SubscriptionTab.tsx
```

Stripe webhooks update `User.tier`; Settings -> Usage shows current quota consumption.
