# 12 — Stripe Payments

> **Status:** Implemented — Test mode only. Production requires live keys + deployed webhook endpoint.
> **Branch:** `feat/payments`
> **References:** https://docs.stripe.com/testing | Test cards: https://docs.stripe.com/testing#cards

---

## What Was Built

### Registration flow (step 2)

After completing the sign-up form, the user is redirected to `/onboarding/plan` instead of directly to `/home`.

- `/onboarding/plan` — plan picker with monthly/annual billing toggle and 4 plan cards (Free, Pro, Premium, Enterprise).
  - **Free** → skips payment, goes straight to `/home`.
  - **Pro / Premium** → redirects to Stripe Checkout (hosted).
  - **Enterprise** → `mailto:` contact link.
- `/onboarding/success` — server page Stripe returns to after a completed checkout. Instantly syncs the user's tier from the Stripe session, then redirects to `/home`. The webhook is a durable fallback for cases where the user closes the tab before the redirect completes.

### Settings → Subscription tab

New tab added to `/settings`: **Subscription** (EN) / **Abonnement** (DE).

- **Free users:** billing toggle + Pro/Premium upgrade cards with subscribe CTAs. Enterprise contact link.
- **Paid users:** shows current plan badge + "Manage subscription" button → opens the Stripe Customer Portal (redirects to `billing.stripe.com`).

---

## Architecture

```
lib/stripe/
  client.ts            Stripe SDK singleton (server-only). Throws at startup if STRIPE_SECRET_KEY is missing.
  sync.ts              syncUserTierFromSubscription() — single function that maps priceId → Tier and writes to DB.
  checkout.ts          createCheckoutSession() — creates a hosted Checkout URL.
  portal.ts            createPortalSession() — creates a Customer Portal URL.

app/api/stripe/
  webhook/route.ts     Handles: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.
  checkout/route.ts    POST — auth + validate → createCheckoutSession → return { url }.
  portal/route.ts      POST — auth → createPortalSession → return { url }.

app/(app)/onboarding/
  plan/page.tsx        Server page — passes price IDs from env to PlanPickerShell.
  success/page.tsx     Server page — syncs tier on return from Stripe, then redirects /home.

components/onboarding/
  PlanPickerShell.tsx  Client component — billing toggle, 4 plan cards, CTAs.
  index.ts             Barrel export.

components/settings/
  SubscriptionTab.tsx  Client component — current plan + manage button (paid) or upgrade cards (free).

prisma/schema.prisma   Added: stripeCustomerId String? @unique @map("stripe_customer_id") on User.
lib/auth/auth.ts       Added: databaseHooks.user.create.after — creates Stripe customer on registration.
                       On failure: deletes the just-created user and throws (atomic registration).
```

### Tier sync — data flow

```
Registration
  └─ auth.ts hook → stripe.customers.create() → user.stripeCustomerId saved

Checkout completed
  └─ /onboarding/success (instant) ─┐
  └─ /api/stripe/webhook (fallback) ─┴─ syncUserTierFromSubscription() → user.tier updated

Subscription changed / cancelled
  └─ /api/stripe/webhook → syncUserTierFromSubscription() → user.tier updated
```

### Price ID → Tier mapping

`lib/stripe/sync.ts` reads four env vars at call-time and builds the map:

| Env var                        | Tier      |
| ------------------------------ | --------- |
| `STRIPE_PRICE_PRO_MONTHLY`     | `pro`     |
| `STRIPE_PRICE_PRO_ANNUAL`      | `pro`     |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `premium` |
| `STRIPE_PRICE_PREMIUM_ANNUAL`  | `premium` |

Any unrecognised price ID falls back to `free`.

---

## Environment Variables

```env
STRIPE_SECRET_KEY="sk_test_..."             # Required. sk_test_ for test mode.
STRIPE_PRICE_PRO_MONTHLY="price_..."        # From stripe-seed output or Dashboard.
STRIPE_PRICE_PRO_ANNUAL="price_..."
STRIPE_PRICE_PREMIUM_MONTHLY="price_..."
STRIPE_PRICE_PREMIUM_ANNUAL="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."           # Required for webhook verification.
```

---

## Setup (Test Mode)

**1. Create products and prices in Stripe test account:**

```bash
npx tsx scripts/stripe-seed.ts
```

Copy the printed `price_...` IDs into `.env`.

**2. Webhook secret — local dev:**

Recommended: Stripe CLI (install once from https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

Alternative (no CLI): Use ngrok or VS Code port forwarding to expose port 3000 publicly, then add the URL as a webhook endpoint in the Stripe Dashboard with the three required events (see below). Copy the generated `whsec_` into `.env`.

> For local testing the webhook is optional — the `/onboarding/success` page syncs the tier directly on return from Stripe.

**3. Webhook events to register (Dashboard or CLI):**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Endpoint: `POST /api/stripe/webhook`

---

## Test Cards

Full list: https://docs.stripe.com/testing#cards

| Card number           | Scenario                    |
| --------------------- | --------------------------- |
| `4242 4242 4242 4242` | Success                     |
| `4000 0025 0000 3155` | 3DS authentication required |
| `4000 0000 0000 9995` | Card declined               |

Use any future expiry date, any 3-digit CVC, any postal code.

---

## Current Plan Prices

| Plan       | Monthly | Annual  |
| ---------- | ------- | ------- |
| Free       | €0      | —       |
| Pro        | €9/mo   | €89/yr  |
| Premium    | €19/mo  | €179/yr |
| Enterprise | Custom  | Custom  |

---

## Known Missing / Pending

The following items are **not yet implemented** and are tracked for a follow-up task:

- **Invoice history** — users cannot view their past invoices inside the app. Currently only accessible via the Stripe Customer Portal on `billing.stripe.com`.
- **Auto-renewal display** — the UI does not show whether auto-renewal is on/off. Stripe subscriptions renew automatically by default; this is not surfaced in the Subscription tab.
- **`/plans` page not updated** — the existing `/pricing` (Plans) page (`components/pricing/PricingShell.tsx`) still renders as a read-only comparison table with no subscribe CTAs. It should be updated to use the same checkout flow as the Subscription tab.
- **In-app subscription management** — upgrade, downgrade, and cancellation currently redirect to the Stripe Customer Portal. These flows should be handled entirely inside the app without leaving `billing.stripe.com`.
- **Downgrade path** — there is no downgrade option (e.g. Premium → Pro, or any paid → Free). This requires cancelling the current subscription and creating a new one, plus handling the proration logic.
- **Cancellation UI** — cancellation currently happens on the Stripe portal. A cancellation flow (with confirmation dialog) needs to be built inside `/settings → Subscription`.
