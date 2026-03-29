# See-Sweet Phase 6 — SaaS Launch Layer

## Plan

### Scope

Phase 6 prepares See-Sweet for commercial operation. Every prior phase assumed a single trusted user — Phase 6 introduces the infrastructure required to charge, onboard, protect, and support a pool of external paying users.

The four pillars are:

1. **Billing** — Stripe integration, plan enforcement, and subscription lifecycle (Skip metered usage for now; charge by tier only)
2. **Email** — transactional delivery for auth and lifecycle events (Skip marketing emails for now)
3. **Admin** — internal user management, usage visibility, and tier control
4. **Rate limiting & edge protection** — guarding LLM and API routes from abuse before go-live

A secondary goal is polishing the first-run user experience so that users who arrive from a marketing page understand the product before they invest time setting it up.

---

### Guiding Principles

- **Billing gates features, not data.** Users can always export or review data they already created. Limits apply to new creation.
- **Email is transactional only.** No marketing emails are sent from within the product. That belongs in a separate CRM.
- **Admin is internal tooling.** The admin surface does not need design polish — it needs correctness and safety.
- **Rate limiting is additive.** It must not break existing authenticated flows. Start at generous limits (e.g. 60 req/min) and tighten after observing real usage.

---

### Feature 1 — Billing (Stripe)

The `tier` field on `User` (`free | pro | premium`) already exists. Phase 6 connects it to a real payment flow.

**Plan limits:**

| Tier      | Knowledge docs | Chats / day | Chats history / total | Chat-widget chats request / day | Chat-widget tools request / day | Nudges | Price |
| --------- | -------------- | ----------- | --------------------- | ------------------------------- | ------------------------------- | ------ | ----- |
| `free`    | 3              | 10          | 10                    | 30                              | 5                               | Off    | Off   |
| `pro`     | 25             | 30          | 20                    | 60                              | 25                              | On     | $X    |
| `premium` | 50             | 100         | 50                    | 120                             | 50                              | On     | $Y    |

- IMPORTANT:
  - **Chats per day means if users created a chat then deleted it, the count still applies.**

**Behavior:**

- `lib/billing/stripe.ts` — Stripe client singleton, webhook signature verification helper
- `lib/billing/enforce.logic.ts` — `assertWithinPlan(userId, resource)` throws a typed `PlanLimitError` when a limit is exceeded; called at the top of relevant create logic functions
- `app/api/billing/checkout/route.ts` — POST: creates a Stripe Checkout session for the requested tier; returns `{ url }`
- `app/api/billing/portal/route.ts` — POST: creates a Stripe Customer Portal session for subscription management; returns `{ url }`
- `app/api/billing/webhook/route.ts` — POST: handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`; updates `User.tier` accordingly
- `User` schema gains `stripeCustomerId String?` for the customer association
- Settings page gains a "Plan & Billing" tab showing current tier, usage meters, and Upgrade / Manage buttons
- i18n keys `billing.*` (en + de)

---

### Feature 2 — Email (Resend)

Better Auth already supports SMTP adapters. Phase 6 connects it to [Resend](https://resend.com) and adds lifecycle emails beyond auth.

**Emails to implement:**

| Trigger                | Template             |
| ---------------------- | -------------------- |
| Sign-up                | Welcome + verify     |
| Password reset         | Reset link           |
| Email verification     | Verify link          |
| Subscription activated | "You're on Pro"      |
| Subscription cancelled | "Your plan ends on…" |

**Behavior:**

- `lib/email/resend.ts` — Resend client singleton, `sendEmail(to, subject, html)` wrapper
- `lib/email/templates/` — one file per template (plain HTML strings, no framework needed)
- Better Auth email hooks configured in `lib/auth.ts` to call the Resend wrapper
- Billing webhook calls `sendEmail` after tier changes
- `RESEND_API_KEY` and `EMAIL_FROM` added to `.env`

---

### Feature 3 — Admin Panel

A minimal internal surface gated behind `role: "admin"`. Reached at `/admin`.

**Views:**

| View           | Contents                                                          |
| -------------- | ----------------------------------------------------------------- |
| Users          | Table: email, tier, createdAt, knowledgeCharsUsed, actions        |
| User detail    | Full preference view, tier override, danger zone (delete account) |
| Usage overview | Aggregate: total users, active today, docs uploaded, chats sent   |

**Behavior:**

- `middleware.ts` extended: requests to `/admin/*` redirect to `/home` unless `session.user.role === "admin"`
- `app/admin/` — server pages only; no client state (simple table renders)
- `lib/admin/stats.logic.ts` — aggregation queries (total users, active in last 24h, etc.)
- `lib/admin/user-management.logic.ts` — `setUserTier`, `deleteUser` (hard delete + cascades)
- No i18n required — admin is internal English-only tooling

---

### Feature 4 — Rate Limiting

Applied at the Next.js middleware layer using an in-memory sliding window (single-instance) or Upstash Redis (multi-instance / Vercel).

**Limits:**

| Route pattern          | Limit                   | Window |
| ---------------------- | ----------------------- | ------ |
| `POST /api/chat`       | 60 requests             | 1 min  |
| `POST /api/briefing`   | 5 requests              | 1 hour |
| `POST /api/*/prep`     | 10 requests             | 1 hour |
| `POST /api/nudges/run` | Already gated by cookie |        |
| All other `/api/*`     | 300 requests            | 1 min  |

**Behavior:**

- `lib/security/rate-limit.ts` — `checkRateLimit(identifier, limit, windowMs)` returns `{ allowed, retryAfter }`; identifier is `userId` for authenticated routes, IP for unauthenticated
- Applied in `middleware.ts` before auth check for unauthenticated routes; applied inside route handlers for LLM-heavy endpoints
- Returns `429` with `Retry-After` header when exceeded
- No new dependencies needed for single-instance; add `@upstash/ratelimit` + `@upstash/redis` if Vercel deployment is targeted

---

### Feature 5 — Onboarding Flow

First-run experience for users who arrive after signing up. Shown once, then never again (tracked via `User.preferences.onboardingDone`).

**Steps:**

1. Choose display language (pre-filled from browser locale)
2. Name your assistant (or keep "Atlas")
3. Upload your first knowledge document — or skip
4. Short tour tooltip sequence covering the nav items

**Behavior:**

- `app/onboarding/page.tsx` — multi-step wizard, server-checks `onboardingDone` flag and redirects to `/home` if already set
- On completion: PATCH `/api/settings` with `{ onboardingDone: true }` plus any wizard values
- `middleware.ts` extended: authenticated users with no `onboardingDone` flag are redirected to `/onboarding` on their first request to any protected page
- i18n keys `onboarding.*` (en + de)

---

### API Routes Summary

| Method | Route                   | Auth   | Purpose                        |
| ------ | ----------------------- | ------ | ------------------------------ |
| POST   | `/api/billing/checkout` | User   | Create Stripe Checkout session |
| POST   | `/api/billing/portal`   | User   | Create Stripe Portal session   |
| POST   | `/api/billing/webhook`  | Stripe | Handle subscription events     |
| GET    | `/admin`                | Admin  | User list                      |
| GET    | `/admin/users/[id]`     | Admin  | User detail                    |

---

### Schema Changes

```prisma
// On User model — add:
stripeCustomerId String?
```

Migration name: `add_stripe_customer_id`

No other new models needed. `onboardingDone` and `nudgeLastFired` live in the existing `preferences Json` field.

---

### Design Decisions

| #   | Decision                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Stripe is preferred over Lemon Squeezy for billing — better webhook reliability and wider ecosystem.         |
| 2   | Resend is preferred over SMTP for email — simple API, generous free tier, React Email optional later.        |
| 3   | Admin panel is server-rendered only — no client state minimises attack surface.                              |
| 4   | Rate limiting starts in-memory — avoids Redis dependency for single-instance deploys; swap path is explicit. |
| 5   | Onboarding is a hard redirect, not a modal — modals are skippable; a dedicated page is harder to dismiss.    |

---

## Done

- **Feature 3 — Admin Panel**: `lib/admin/stats.logic.ts`, `lib/admin/user-management.logic.ts`, `app/admin/page.tsx`, `app/admin/users/[id]/page.tsx`, `app/admin/users/[id]/AdminUserActions.tsx`, `app/api/admin/users/[id]/route.ts`. Admin role exposed via `auth.ts` `additionalFields`; role guard is server-side in pages (not middleware).
- **Feature 4 — Rate Limiting**: `briefingRateLimiter` (5/hour) and `prepRateLimiter` (10/hour) added to `lib/security.ts` and applied to `POST /api/briefing` and `POST /api/meetings/[id]/prep`.
- **Feature 5 — Onboarding Flow**: `app/onboarding/page.tsx` + `app/onboarding/OnboardingWizard.tsx` (3-step wizard: language, assistant name, done). `app/api/onboarding/complete/route.ts` merges choices into `User.preferences` and sets an `ob_done` cookie. `app/api/onboarding/confirm/route.ts` (GET) sets the same cookie for already-onboarded users who lack it (e.g. after a fresh deploy). `proxy.ts` redirects any authenticated user without the `ob_done` cookie to `/onboarding` before reaching any protected page. `app/home/page.tsx` retains a DB-level fallback guard. i18n keys `onboarding.*` added (en + de).

> Features 1 (Billing) and 2 (Email) deferred — see **Later**.

- **Seed scripts**:
  - `prisma/seed-admin.ts` — creates or promotes one admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` env vars. Run via `npm run db:seed-admin` (also called by `npm run db:seed`). Idempotent.
  - `prisma/seed-demo.ts` — creates 3 demo users (Sophie Laurent / pro, Marcus Webb / free, Lena Fischer / premium) each with contacts, meetings with participants, tasks, and full assistant preferences. Run via `npm run db:seed-demo`. Idempotent — skips existing emails.
  - `prisma/seed.ts` — master entry point (`npm run db:seed`), calls `seedAdmin()` by default; demo seed import commented out for production safety.

  **Admin account** (seeded by `db:seed-admin`):

  | Field    | Value               |
  | -------- | ------------------- |
  | Email    | admin@see-sweet.dev |
  | Password | Admin@123456!       |
  | Name     | Administrator       |
  | Role     | admin               |

  **Demo accounts** (seeded by `db:seed-demo`, password `Demo1234!` for all):

  | Name           | Email                     | Tier    | Assistant | Language |
  | -------------- | ------------------------- | ------- | --------- | -------- |
  | Sophie Laurent | sophie@demo.see-sweet.dev | pro     | Iris      | en       |
  | Marcus Webb    | marcus@demo.see-sweet.dev | free    | Atlas     | en       |
  | Lena Fischer   | lena@demo.see-sweet.dev   | premium | Nova      | de       |

- **Navbar admin link**: Settings dropdown conditionally renders an **Admin** item when `session.user.role === "admin"`. Role flows from `layout.tsx` → `Navbar` via `sessionUser.role`. Hidden for all other roles.

## Later

- Marketing landing page (`/` public route with feature highlights and pricing table)
- Cookie consent / GDPR banner for EU users
- Audit log (who changed what tier, when)
- Team / workspace support (multi-user accounts)
- Mobile-responsive polish pass
