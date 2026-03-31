# Google Calendar Integration — Setup Guide

This guide covers everything needed to make the Google Calendar integration functional, from creating the Google Cloud project to setting local and production environment variables.

---

## 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Click **Select a project → New Project**.
3. Give it a name (e.g. `see-sweet`) and click **Create**.

---

## 2. Enable the Google Calendar API

1. In the left menu, go to **APIs & Services → Library**.
2. Search for **Google Calendar API**.
3. Click it, then click **Enable**.

---

## 3. Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** (or **Internal** if this is a personal Google Workspace org).
3. Fill in the required fields:
   - **App name**: See-Sweet
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through the Scopes and Test Users steps.
5. On the **Scopes** step, add the scope:
   ```
   https://www.googleapis.com/auth/calendar.readonly
   ```
6. On the **Test Users** step (External apps only), add your own Google account so you can test before verification.
7. Click **Back to Dashboard**.

> **Note:** While the app is in "Testing" status, only added test users can authorize it. You do not need to submit for verification for personal/private use.

---

## 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Name it (e.g. `see-sweet-web`).
5. Under **Authorized redirect URIs**, add:
   - Local: `http://localhost:3000/api/integrations/google/callback`
   - Production: `https://your-domain.com/api/integrations/google/callback`
6. Click **Create**.
7. Copy the **Client ID** and **Client Secret** — you will need them below.

---

## 5. Environment Variables

Add these to your `.env.local` (local dev) and to your deployment environment (Vercel dashboard or equivalent).

```env
# ── Google Calendar Integration ──────────────────────────────────────────────

# From step 4 above
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Must exactly match one of the Authorized redirect URIs you registered in step 4
# Local dev:
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
# Production (change to your real domain):
# GOOGLE_REDIRECT_URI=https://your-domain.com/api/integrations/google/callback

# ── Cron Jobs ────────────────────────────────────────────────────────────────

# Any strong random string — used to authenticate requests to /api/cron/* routes
# Generate one: openssl rand -hex 32
CRON_SECRET=replace_with_a_random_secret

# ── App URL (already required by Better Auth) ────────────────────────────────

# Used in OAuth callback redirect
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: NEXT_PUBLIC_APP_URL=https://your-domain.com
```

> `BETTER_AUTH_SECRET` is already required by the existing auth setup and is reused internally for the OAuth state CSRF signature — no extra setup needed.

---

## 6. Vercel Deployment

### Environment variables

In **Vercel → Project → Settings → Environment Variables**, add all five variables above with their production values.

### Cron jobs

`vercel.json` at the repo root already configures the four scheduled jobs:

| Route                            | Schedule (UTC)   | What it does                       |
| -------------------------------- | ---------------- | ---------------------------------- |
| `GET /api/cron/briefing`         | Daily at 07:00   | Daily briefing per opted-in user   |
| `GET /api/cron/tasks-overdue`    | Daily at 09:00   | Overdue task reminder              |
| `GET /api/cron/meeting-followup` | Daily at 18:00   | Follow-up prompt for past meetings |
| `GET /api/cron/digest`           | Fridays at 17:00 | Weekly activity digest             |

Vercel Cron automatically calls these routes with the `Authorization: Bearer $CRON_SECRET` header — no extra wiring needed as long as `CRON_SECRET` is set.

### Triggering crons manually (any environment)

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/briefing
```

---

## 7. Local Testing Flow

1. Copy the env vars into `.env.local`.
2. Start the dev server: `npm run dev`.
3. Log in, go to **Settings → App → Integrations**.
4. Click **Connect Google Calendar** — you will be redirected to Google's consent screen.
5. Authorize the app (must be a test user if app is in Testing status).
6. You are redirected back to `/settings?tab=integrations` and the card shows **Connected**.
7. Click **Sync now** — the next 30 days of calendar events are pulled in as Meetings.

---

## 8. Security Notes

- `accessToken` and `refreshToken` are stored in the `integration` table. Use database-level encryption (e.g. Supabase column encryption, Postgres `pgcrypto`) or a secrets vault if the threat model requires it. Never log or expose these fields in API responses.
- The OAuth flow uses a **signed JWT state parameter** (CSRF protection) keyed by `BETTER_AUTH_SECRET`, expiring in 10 minutes.
- The sync route is user-scoped — a user can only sync their own integration.
- Calendar sync requests only the `calendar.readonly` scope — no write access to the user's calendar.
