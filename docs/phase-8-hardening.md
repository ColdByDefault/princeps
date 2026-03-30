# See-Sweet Phase 8 — Production Hardening (Phase-7 MVP → Production-grade)

## Plan

### Scope

Phase 7 shipped the Google Calendar integration, OAuth flow, 4 scheduled cron jobs, notification hygiene fix, and app-settings cadence toggles. All of it is MVP-grade: correct enough to build on, not robust enough for real daily use.

Phase 8 is a focused hardening pass — no new features. Every item below is a known gap that will cause silent failures, bad UX, or misleading output in production. The work is grouped into four areas.

---

### Group A — Correctness & Reliability

#### A1 — Google sync: pagination

**Problem:** `syncGoogleCalendar` sets `maxResults: 100` and never follows `nextPageToken`. A user with more than 100 events in the next 30 days gets a silent truncation — no error, no warning, just missing meetings.

**Fix:** Loop the Google Calendar API call until no `nextPageToken` is returned. Each page should extend the accumulated events list before the upsert phase runs.

**File:** `lib/integrations/google-calendar.logic.ts`

**Acceptance:** A calendar with 250+ events in the next 30 days syncs all of them.

---

#### A2 — Token revocation handling (`invalid_grant`)

**Problem:** If the user revokes access from their Google Account settings, the next token refresh returns `{ "error": "invalid_grant" }`. The current code throws a generic `Error` and leaves the `Integration` record in the database forever — in a permanently broken state. All future syncs continue to fail silently.

**Fix:** In `refreshGoogleToken`, detect the `invalid_grant` error code in the response body and delete the `Integration` row for that user before throwing. Introduce a typed `GoogleAuthRevokedError` class so callers can distinguish revocation from transient errors. The sync route should catch `GoogleAuthRevokedError` and return `{ error: "google_revoked", status: 401 }` to the UI.

**File:** `lib/integrations/google-oauth.logic.ts`, `app/api/integrations/google/sync/route.ts`

**Acceptance:** After revoking from Google, next sync removes the integration row and the UI shows the card as disconnected.

---

#### A3 — Cron loop per-user isolation

**Problem:** All 4 cron job loops (`briefing`, `tasks-overdue`, `meeting-followup`, `digest`) have a `try/catch` only around the notification-generation portion of each user's block. The preference fetch, dedup check, and DB queries that precede it are unprotected. If a single user's data causes an error, the entire loop aborts and all subsequent users are skipped — silently.

**Fix:** Wrap the entire per-user block (from preference parsing through notification emission) in a single `try/catch` in each job. Log the error with the `userId` but continue the loop.

**Files:** `lib/cron/briefing.logic.ts`, `lib/cron/tasks-overdue.logic.ts`, `lib/cron/meeting-followup.logic.ts`, `lib/cron/digest.logic.ts`

**Acceptance:** If one user's block throws, all other users still receive their notifications.

---

#### A4 — Sync N+1 → batch DB fetch

**Problem:** `syncGoogleCalendar` calls `db.meeting.findUnique` once per calendar event to check for an existing record. For 100 events this is 100 sequential queries before any upsert. At 250 events (post-pagination fix) it becomes 250.

**Fix:** Collect all `event.id` values from the fetched page(s), run one `db.meeting.findMany({ where: { googleEventId: { in: [...] } } })`, build a `Set<string>` of existing IDs, then split the events into two arrays (creates and updates). Run creates and updates in parallel with `Promise.all`.

**File:** `lib/integrations/google-calendar.logic.ts`

**Acceptance:** One Google Calendar API page fetch → 2 Prisma queries (one findMany + one transaction), regardless of event count.

---

### Group B — UX & Feedback

#### B1 — OAuth result toast from callback query params

**Problem:** The OAuth callback redirects to `/settings?tab=integrations&success=google_connected` or `?error=google_denied|google_state_invalid|google_exchange_failed`. The `IntegrationsTab` component never reads these params, so the user sees no feedback — no success toast, no error explanation.

**Fix:** In the settings app page (`app/(app)/settings/app/page.tsx`), read `searchParams.success` and `searchParams.error` and pass them to `IntegrationsTab`. On mount, if these values are present, fire a toast and clean the URL via `router.replace('/settings?tab=integrations')`.

**Files:** `app/(app)/settings/app/page.tsx`, `components/settings/IntegrationsTab.tsx`

**i18n keys needed:** `integrations.google.connectSuccess`, `integrations.google.errorDenied`, `integrations.google.errorInvalid`, `integrations.google.errorFailed`

**Acceptance:** After a successful connect, user sees a green toast. After a denied or failed OAuth, user sees a red toast explaining what happened.

---

#### B2 — IntegrationsTab loading skeleton

**Problem:** While `status === null` (the initial `GET /api/integrations/google` is in flight), the Google Calendar card renders nothing — the tab flashes empty before content appears.

**Fix:** Show a minimal skeleton UI (e.g. `animate-pulse` placeholder rows matching the card height) while `status === null`. Content renders normally once the fetch completes.

**File:** `components/settings/IntegrationsTab.tsx`

**Acceptance:** No empty flash on tab load; a skeleton is visible within one render cycle.

---

#### B3 — Sync result toast with event counts

**Problem:** `handleSync` receives `{ upserted, skipped }` from `POST /api/integrations/google/sync` but the success toast says only "Calendar synced successfully." — the counts are discarded.

**Fix:** Include the counts in the toast body: e.g. `"12 events synced, 3 skipped."` Fall back to the generic message if counts are missing.

**File:** `components/settings/IntegrationsTab.tsx`

**i18n keys needed:** `integrations.google.syncCount` (e.g. `"{upserted} events synced, {skipped} skipped."`)

**Acceptance:** After a manual sync, the toast shows the actual event counts returned by the API.

---

#### B4 — Disconnect confirmation dialog

**Problem:** Clicking "Disconnect" immediately fires `DELETE /api/integrations/google`. This is a destructive action (deauthorizes the OAuth grant + removes the integration record) with no confirmation step.

**Fix:** Wrap the disconnect action in a shadcn `AlertDialog` with a confirm prompt before executing the DELETE.

**File:** `components/settings/IntegrationsTab.tsx`

**Acceptance:** Clicking Disconnect opens a dialog; user must confirm before the integration is removed.

---

### Group C — Timezone Awareness

#### C1 — Timezone-aware day-of-week for cron jobs

**Problem:** `runBriefingJob` skips the weekly briefing when `new Date().getUTCDay() !== 5` (not UTC Friday). `runWeeklyDigestJob` computes the ISO week start using UTC. For users in UTC+9 or UTC-8, "Friday" starts 9 hours earlier or ends 8 hours later than UTC Friday — they may never receive their weekly notification or receive it on the wrong day.

**Fix:** Use `Intl.DateTimeFormat` with `user.timezone` to determine the local day-of-week for each user. Fall back to UTC if `user.timezone` is missing or invalid. Apply the same correction to the ISO week-start calculation in the digest job.

**Files:** `lib/cron/briefing.logic.ts`, `lib/cron/digest.logic.ts`

**Acceptance:** A user in `Asia/Tokyo` who sets "weekly briefing" receives it on their Friday, not UTC Friday.

---

#### C2 — Meeting follow-up: use effective end time

**Problem:** `runMeetingFollowupJob` filters meetings where `scheduledAt < twoHoursAgo`. This uses the meeting _start_ time as a proxy for whether it has ended. A 3-hour meeting that started 1.5 hours ago has not ended yet, but will be included. A 15-minute meeting that started 3 hours ago ended long ago and is correctly included.

**Fix:** For meetings that have a `durationMin` value, compute the effective end time as `scheduledAt + durationMin * 60_000` and use that for the `< twoHoursAgo` comparison. For meetings without `durationMin`, keep the current `scheduledAt`-based filter as a fallback.

**File:** `lib/cron/meeting-followup.logic.ts`

**Acceptance:** A 3-hour meeting that starts 2 hours ago is not included; a 30-minute meeting that started 3 hours ago is included.

---

### Group D — Validation & Developer Experience

#### D1 — Env var guard in connect and sync routes

**Problem:** `getGoogleAuthUrl` uses `process.env.GOOGLE_CLIENT_ID!` — the `!` silences TypeScript but at runtime the value is `undefined` if the env var is not set. The resulting OAuth URL is silently malformed, and the user is redirected to a Google error page with no explanation.

**Fix:** In `app/api/integrations/google/connect/route.ts` and `app/api/integrations/google/sync/route.ts`, check for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` at the top of the handler. If any are missing, return `503 { error: "Google integration is not configured." }` before doing anything else.

**Files:** `app/api/integrations/google/connect/route.ts`, `app/api/integrations/google/sync/route.ts`

**Acceptance:** Hitting `/api/integrations/google/connect` without env vars returns 503 with a clear message instead of a broken redirect.

---

#### D2 — Missing `CRON_SECRET` dev warning

**Problem:** If `CRON_SECRET` is not set in the environment, every cron request returns `401 Unauthorized` with no indication of why. In local dev this means all cron endpoints silently fail to fire, with no hint that a required env var is missing.

**Fix:** In the `CRON_SECRET` check block in each cron route, add a `console.warn` that explicitly names the missing variable when `process.env.CRON_SECRET` is falsy (rather than just checking equality with the header value).

**Files:** `app/api/cron/briefing/route.ts`, `app/api/cron/tasks-overdue/route.ts`, `app/api/cron/meeting-followup/route.ts`, `app/api/cron/digest/route.ts`

**Acceptance:** Starting dev without `CRON_SECRET` and hitting a cron route logs `[cron] CRON_SECRET env var is not set.` to the server console.

---

## Implementation Order

| ID  | Area                  | Priority | Files                                |
| --- | --------------------- | -------- | ------------------------------------ |
| A3  | Cron loop isolation   | Highest  | 4 cron logic files                   |
| A2  | Token revocation      | High     | google-oauth.logic.ts, sync/route.ts |
| A1  | Sync pagination       | High     | google-calendar.logic.ts             |
| A4  | Sync N+1 batching     | High     | google-calendar.logic.ts             |
| B1  | OAuth toast feedback  | High     | settings page, IntegrationsTab       |
| D1  | Env var guard         | Medium   | connect/route.ts, sync/route.ts      |
| B2  | Loading skeleton      | Medium   | IntegrationsTab                      |
| B3  | Sync count toast      | Medium   | IntegrationsTab                      |
| B4  | Disconnect confirm    | Medium   | IntegrationsTab                      |
| C1  | Timezone day-of-week  | Medium   | briefing.logic.ts, digest.logic.ts   |
| C2  | Meeting end-time calc | Medium   | meeting-followup.logic.ts            |
| D2  | CRON_SECRET warning   | Low      | 4 cron route files                   |

---

## Done

_(filled in as items are completed)_

## Later

- Per-user timezone for `alreadyFiredToday` / `alreadyFiredThisWeek` dedup window boundaries (currently UTC)
- Rate-limit manual sync button (prevent rapid repeated calls)
- Expose integration health status (last error, last successful sync) to the user
