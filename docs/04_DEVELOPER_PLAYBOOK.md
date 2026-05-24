# Developer Playbook

Last updated: 2026-05-08

Use this when changing Princeps. Keep the app user-scoped, localized, tier-aware, and easy to reason about.

## Local Setup

```bash
npm install
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

The dev command runs a database healthcheck before starting Next.js.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Tests use Vitest. Server logic tests run in the default Node environment with
database and external service boundaries mocked. Component tests can use React
Testing Library and jsdom when they need browser APIs.

## Before You Change Code

Check:

- Which authenticated `userId` owns the data?
- Which existing feature is the closest reference?
- Does the change need Prisma, API routes, UI, i18n, tools, context, tiers, settings, notifications, integrations, or docs?
- What must remain server-only?
- Which tests or build checks match the risk?

## New Feature Checklist

Typical CRUD feature shape:

```text
prisma/schema.prisma
types/api.ts
lib/features/<feature>/schemas.ts
lib/features/<feature>/shared.logic.ts
lib/features/<feature>/create.logic.ts
lib/features/<feature>/list.logic.ts
lib/features/<feature>/update.logic.ts
lib/features/<feature>/delete.logic.ts
lib/features/<feature>/index.ts
app/api/<feature>/route.ts
app/api/<feature>/[id]/route.ts
app/(app)/<feature>/page.tsx
components/<feature>/
messages/de.json
messages/en.json
```

Rules:

- Add `userId` and useful indexes to stored user data.
- Keep API routes thin: auth, parse, gate, delegate, respond.
- Keep business logic in `lib/features/<feature>/`.
- Keep client mutation logic in `components/<feature>/logic/`.
- Return client-safe types with ISO date strings.
- Localize all user-facing copy.

i18n key strategy:

- Keep `common` as the first top-level namespace in `messages/de.json` and `messages/en.json`.
- Put reusable generic labels in `common.*` (actions, states, entities, fields, filters, status, confirmation).
- Keep feature/domain-specific copy in feature namespaces.
- Reuse `common.*` before adding new feature-local labels with the same meaning.

Good references:

- Tasks for clean CRUD.
- Contacts for relationship data.
- Meetings for side effects, participants, AI prep packs, and integrations.

## LLM Tools And Context

Add tools only when the assistant should act, not just talk.

Tool checklist:

- Add registry entries in `lib/ai/tools/registry/<feature>.registry.ts`.
- Set `minTier` and `group`.
- Add a handler in `lib/ai/tools/handlers/<feature>.handler.ts`.
- Validate all args with Zod or a feature schema.
- Resolve names to IDs in the handler, not the registry.
- Enforce the same tier limits as the API route.
- Return compact `ActionResult` data.
- Spread registry and handlers into the orchestration files.

Context checklist:

- Add `lib/ai/context/<feature>.slot.ts` when the assistant should always know about the data.
- Fetch only user-scoped, compact, relevant data.
- Keep context human-readable and bounded.
- Update prompt/tool availability if tier or disabled-tool settings affect the feature.

## Tiers And Usage

Plan limits live in `types/billing.ts`. Enforcement lives in `lib/platform/tiers/enforce.ts`.

Use the right limit style:

- At-rest caps for stored records.
- Daily counters for burst guards.
- Monthly counters for LLM and expensive actions.
- Lifetime counters for anti-bypass behavior, such as knowledge characters.
- `0` means disabled for that tier.
- `-1` means unlimited.

Enforce before writes or expensive calls. If an action exists in both UI/API and LLM tools, both paths need equivalent gates.

## Settings

Most user preferences save through:

```text
PATCH /api/settings
```

When adding a setting:

- Parse it in `lib/platform/settings/user-preferences.logic.ts`.
- Accept it in `app/api/settings/route.ts`.
- Load it in `app/(app)/settings/page.tsx`.
- Pass it into the owning settings tab.
- Add localized strings.
- Wire it into the real consumer.

Keep usage, subscription, and integration state out of `User.preferences` unless it is truly a preference.

## Integrations

Current live examples:

- Google Calendar for OAuth, sync, and two-way meeting side effects.
- Google Drive for OAuth, file listing, and Knowledge import.

New provider checklist:

- Pick a stable provider string, for example `gmail` or `microsoft_outlook`.
- Add `lib/platform/integrations/<provider>/client.ts`.
- Add provider actions such as `sync.ts`, `events.ts`, or `import.ts`.
- Add routes under `app/api/integrations/<route-slug>/`.
- Use a provider-specific OAuth state cookie.
- Store tokens with `upsertIntegration()`.
- Read tokens with `getValidToken()`.
- Add Settings UI metadata and i18n.
- Add source/dedupe fields to the owning feature if needed.
- Apply tier and usage gates before importing records.

Request minimal scopes. Never expose provider tokens to the client.

## Notifications

Use notifications for meaningful assistant/system events, not every CRUD action.

Rules:

- Notifications belong to one user.
- Soft-delete with `dismissed`.
- Use `metadata.date` for once-per-day categories.
- Respect `notificationsEnabled`.
- Respect tier and automation toggles for proactive nudges.

Weather uses Open-Meteo without a key. `FORCE_GREETING=true` bypasses the daily greeting dedupe in development.

## Billing And Stripe

Stripe files live in `lib/platform/stripe/` and `app/api/stripe/`.

Local test setup:

```bash
npx tsx scripts/stripe-seed.ts
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Set:

```text
STRIPE_SECRET_KEY
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_ANNUAL
STRIPE_PRICE_PREMIUM_MONTHLY
STRIPE_PRICE_PREMIUM_ANNUAL
STRIPE_WEBHOOK_SECRET
```

Webhook events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Known product gap: subscription management currently goes through the Stripe Customer Portal; invoice history and richer in-app downgrade/cancel flows are not first-class app screens.

## Email And Password Reset

Password reset currently logs links server-side and stores recent links for the dev-only endpoint:

```text
GET /api/dev/reset-links
```

This endpoint returns `404` outside development.

For production, wire a real provider in `lib/core/auth/auth.ts`, for example Resend or SMTP/Nodemailer, and set a verified `RESET_PASSWORD_FROM_EMAIL`.

## Langfuse

LLM tracing is already wired and production-only.

Set:

```text
LANGFUSE_PUBLIC_KEY
LANGFUSE_SECRET_KEY
LANGFUSE_HOST # optional
```

Tracing records chat calls, streaming chat calls, single embeddings, token counts, tool calls, latency, and errors. It is a no-op without production keys.

## Production Hardening

Before serious multi-user production:

- Encrypt integration access and refresh tokens at rest.
- Configure a real email provider and email verification if required.
- Use Upstash Redis or another distributed rate limiter.
- Verify Stripe live keys, price IDs, and webhook endpoint.
- Decide backup and migration process for Postgres.
- Review all external scopes and privacy copy.
- Run lint, typecheck, and build.

## Done Means

A change is done when:

- It follows existing layer boundaries.
- User ownership is enforced.
- User-facing copy is localized.
- Tier and usage gates match the feature.
- LLM tools/context are updated when relevant.
- Settings, notifications, integrations, and billing are considered.
- Docs are updated when behavior or architecture changes.
