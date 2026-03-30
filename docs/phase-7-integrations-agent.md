# See-Sweet Phase 7 — Calendar Integration & Scheduled Agent Layer

## Plan

### Scope

Phase 7 introduces two capabilities that shift See-Sweet from a purely reactive tool into something that is always oriented toward the user's actual world:

1. **Google Calendar integration (read-only MVP)** — import the user's real calendar into See-Sweet so meetings, prep packs, and briefings reflect what is actually happening.
2. **Scheduled agent behaviors** — cron-triggered jobs (daily briefing, overdue task alerts, meeting follow-up prompts, weekly digest) delivered as in-app notifications on a user-controlled schedule.

A third item is a fix rather than a feature: **notification hygiene** — the `welcome_login` greeting currently fires on every session creation (every login), which is intrusive. This must be corrected in this phase.

---

### Guiding Principles

- **No Vercel lock-in.** All cron jobs are plain Next.js API routes at `/api/cron/*` protected by a `CRON_SECRET` header. `vercel.json` schedules them on Vercel; any other caller (GitHub Actions, VPS cron + curl) can hit the same endpoint. Zero platform-specific SDK.
- **Notification inbox only.** Email delivery is deferred. All scheduled agent outputs go to the in-app notification inbox.
- **User controls the cadence.** A toggle in App Settings switches each scheduled behavior between off, daily, and weekly. Manual (on-demand) remains available regardless.
- **Non-intrusive by default.** Greetings fire at most once per calendar day. Nudges and follow-up prompts respect a minimum cooldown to avoid repetition.

---

### Feature 1 — Notification Hygiene Fix

**Problem:** `onSessionCreated` in `lib/notifications/greetings.logic.ts` fires a `welcome_login` notification every time a session is created — once per login with no daily deduplication. A user who logs in multiple times per day receives multiple greeting notifications.

**Fix:**

- Before generating a `welcome_login`, query the `Notification` table for any `welcome_login` record for this user with `createdAt >= start of today (user's UTC day)`.
- If one exists, skip silently.
- `welcome_signup` is unaffected — it fires once per account lifetime and the 60-second guard already prevents double-fire on the same session.
- No schema change required; the existing `Notification` model is sufficient.

**Acceptance:** a user logging in 10 times on the same day receives exactly 1 `welcome_login` notification for that day.

---

### Feature 2 — Google Calendar Integration (Read-Only)

Gives the user a one-click way to connect their Google Calendar. Connected calendars are polled on demand (manual sync button) and also on a scheduled basis.

#### OAuth Connect Flow

- Settings page gains a new **Integrations** tab.
- Tab shows a Google Calendar connect button. On click: redirect to Google OAuth consent screen with `calendar.readonly` scope.
- Callback at `GET /api/integrations/google/callback` exchanges the code, stores `access_token` and `refresh_token` on the user record (or a new `Integration` model — see Schema Changes).
- Tab shows connected status, last synced time, and a Disconnect button.

#### Sync Behavior

- `POST /api/integrations/google/sync` — authenticated, triggers a manual sync for the current user.
- `GET /api/cron/calendar-sync` — cron endpoint; iterates all users with a connected Google Calendar and runs sync for each. Protected by `CRON_SECRET`.
- Sync logic in `lib/integrations/google-calendar.logic.ts`:
  - Calls Google Calendar API `/calendars/primary/events` with a `timeMin` of now and `timeMax` of now + 30 days.
  - For each event: upsert a `Meeting` record keyed on `googleEventId` (new field on `Meeting`).
  - Sets `title`, `scheduledAt`, `durationMinutes`, `description` from the Google event. Does not overwrite fields the user has already edited in See-Sweet.
  - Skips events that are cancelled or have no start time.
  - Refreshes the access token automatically if expired.

#### Schema Changes

```prisma
model Integration {
  id            String   @id @default(cuid())
  userId        String
  provider      String   // "google_calendar"
  accessToken   String
  refreshToken  String?
  expiresAt     DateTime?
  lastSyncedAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
}
```

```prisma
// On Meeting model — add:
googleEventId String? @unique
```

Migration name: `add_integrations_google_calendar`

#### Environment Variables

| Variable               | Purpose                              |
| ---------------------- | ------------------------------------ |
| `GOOGLE_CLIENT_ID`     | OAuth app client ID                  |
| `GOOGLE_CLIENT_SECRET` | OAuth app client secret              |
| `GOOGLE_REDIRECT_URI`  | Must match Google console callback   |
| `CRON_SECRET`          | Shared secret for all cron endpoints |

#### Security Notes

- `accessToken` and `refreshToken` stored at rest — use field-level encryption or rely on database-level encryption. At minimum, never expose these fields in any API response or log.
- The callback route validates the `state` parameter (CSRF) using a short-lived signed value stored in a cookie during the OAuth redirect.
- Sync route is user-scoped: a user can only trigger sync for their own integration.

#### i18n

Keys `integrations.*` (en + de):

- `integrations.title`, `integrations.google.connect`, `integrations.google.connected`, `integrations.google.lastSynced`, `integrations.google.disconnect`, `integrations.google.syncNow`, `integrations.google.syncSuccess`, `integrations.google.syncError`

---

### Feature 3 — Scheduled Agent Behaviors

Cron-triggered jobs that push notifications into the user's inbox on a configurable schedule.

#### Jobs

| Job                | Cron route                       | Default schedule      | What it does                                                                                                                           |
| ------------------ | -------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Daily briefing     | `GET /api/cron/briefing`         | Daily at 07:00        | Runs the existing briefing pipeline (`lib/briefing/`) for each opted-in user; saves result as a `briefing` category notification.      |
| Overdue task alert | `GET /api/cron/tasks-overdue`    | Daily at 09:00        | Finds tasks past their `dueDate` with no completion; generates a short summary notification listing overdue items grouped by priority. |
| Meeting follow-up  | `GET /api/cron/meeting-followup` | Daily at 18:00        | Finds meetings that ended more than 2 hours ago with no `postMeetingCapture`; pushes a nudge to capture notes and actions.             |
| Weekly digest      | `GET /api/cron/digest`           | Weekly (Friday 17:00) | Summarizes the week: decisions made, tasks closed, meetings held. Opt-in only; off by default.                                         |

#### Cron Endpoint Pattern

```ts
// app/api/cron/briefing/route.ts
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // run job ...
}
```

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/briefing", "schedule": "0 7 * * *" },
    { "path": "/api/cron/tasks-overdue", "schedule": "0 9 * * *" },
    { "path": "/api/cron/meeting-followup", "schedule": "0 18 * * *" },
    { "path": "/api/cron/digest", "schedule": "0 17 * * 5" }
  ]
}
```

Any non-Vercel host triggers the same URLs with `Authorization: Bearer $CRON_SECRET` via its own scheduler.

#### User Opt-In (App Settings)

App Settings gains a **Scheduled notifications** section with per-job controls:

| Setting             | Options              | Default |
| ------------------- | -------------------- | ------- |
| Daily briefing      | Off / Daily / Weekly | Off     |
| Overdue task alerts | Off / Daily          | Off     |
| Meeting follow-up   | Off / On             | Off     |
| Weekly digest       | Off / On             | Off     |

Stored in the existing `User.preferences Json` field under a `scheduledNotifications` key. No schema migration needed.

The cron jobs check each user's preference before running for them — users with a setting off are skipped entirely.

#### Anti-intrusion Guards

- Each cron job checks if a notification of its category was already generated for the user today (or this week for the weekly digest) before running. This prevents duplicate pushes if a cron fires more than once due to retries or misconfiguration.
- Overdue task and meeting follow-up notifications include a minimum 23-hour cooldown per user per category to prevent spamming.

#### i18n

Keys `scheduledNotifications.*` and relevant notification prompt strings (en + de).

---

### API Routes Summary

| Method | Route                               | Auth   | Purpose                                     |
| ------ | ----------------------------------- | ------ | ------------------------------------------- |
| GET    | `/api/integrations/google/connect`  | User   | Redirect to Google OAuth consent screen     |
| GET    | `/api/integrations/google/callback` | None   | OAuth callback — exchange code, store token |
| POST   | `/api/integrations/google/sync`     | User   | Manual calendar sync for current user       |
| DELETE | `/api/integrations/google`          | User   | Disconnect Google Calendar integration      |
| GET    | `/api/cron/briefing`                | Secret | Scheduled daily briefing                    |
| GET    | `/api/cron/tasks-overdue`           | Secret | Scheduled overdue task alerts               |
| GET    | `/api/cron/meeting-followup`        | Secret | Scheduled meeting follow-up prompts         |
| GET    | `/api/cron/digest`                  | Secret | Scheduled weekly digest                     |

---

### File Layout

```
lib/
  integrations/
    google-calendar.logic.ts   — sync, upsert meetings, token refresh
    google-oauth.logic.ts      — OAuth helpers (exchange code, refresh token)
  cron/
    briefing.logic.ts          — per-user briefing job runner
    tasks-overdue.logic.ts     — per-user overdue tasks job runner
    meeting-followup.logic.ts  — per-user follow-up job runner
    digest.logic.ts            — per-user weekly digest job runner
app/
  api/
    integrations/
      google/
        connect/route.ts
        callback/route.ts
        sync/route.ts
        route.ts               — DELETE disconnect
    cron/
      briefing/route.ts
      tasks-overdue/route.ts
      meeting-followup/route.ts
      digest/route.ts
components/
  settings/
    IntegrationsTab.tsx
    ScheduledNotificationsSection.tsx
```

---

## Done

- **Feature 1 — Notification hygiene fix**: `onSessionCreated` in `lib/notifications/greetings.logic.ts` now queries for an existing `welcome_login` notification created today (UTC) before firing. Users receive at most one login greeting per calendar day.

- **Feature 2 — Google Calendar integration (read-only)**:
  - New `Integration` model in Prisma schema with `@@unique([userId, provider])` — extensible to Outlook/other providers.
  - `Meeting.googleEventId String? @unique` added to schema.
  - Migration `add_integrations_google_calendar` applied.
  - `lib/integrations/google-oauth.logic.ts` — `getGoogleAuthUrl`, `exchangeGoogleCode`, `refreshGoogleToken`, `getValidAccessToken`.
  - `lib/integrations/google-calendar.logic.ts` — `syncGoogleCalendar`: polls primary calendar for next 30 days, upserts `Meeting` records. Re-syncs preserve user edits (only `scheduledAt`/`durationMin` updated on existing records).
  - `app/api/integrations/google/connect/route.ts` — redirects to Google OAuth with signed state JWT for CSRF protection.
  - `app/api/integrations/google/callback/route.ts` — verifies state JWT, exchanges code, upserts `Integration`.
  - `app/api/integrations/google/sync/route.ts` — manual sync.
  - `app/api/integrations/google/route.ts` — GET status, DELETE disconnect.
  - `components/settings/IntegrationsTab.tsx` — connect/sync/disconnect UI with live status.
  - i18n keys `integrations.*` added (en + de).

- **Feature 3 — Scheduled agent behaviors**:
  - `lib/cron/shared.logic.ts` — `getScheduledNotifPrefs`, `getScheduledNotifPrefsFromRaw`, `alreadyFiredToday`, `alreadyFiredThisWeek`.
  - `lib/cron/briefing.logic.ts` — daily/weekly briefing delivery to notification inbox.
  - `lib/cron/tasks-overdue.logic.ts` — overdue task alert, lists tasks by priority.
  - `lib/cron/meeting-followup.logic.ts` — nudge for meetings ended >2h ago with no summary.
  - `lib/cron/digest.logic.ts` — Friday weekly digest counting decisions/tasks/meetings.
  - `app/api/cron/{briefing,tasks-overdue,meeting-followup,digest}/route.ts` — `CRON_SECRET` bearer-protected GET endpoints.
  - `vercel.json` — schedules all 4 jobs. Routes are plain HTTP — portable to any external scheduler.
  - `types/settings.ts` extended with `ScheduledNotifPrefs`, `ScheduledCadence`, `DEFAULT_SCHEDULED_NOTIF_PREFS`.
  - `lib/settings/get.logic.ts` + `update.logic.ts` updated to read/write `scheduledNotifications` in `User.preferences`.
  - `components/settings/ScheduledNotificationsSection.tsx` — per-job cadence selector UI.
  - Settings App page now renders both new sections below existing content.
  - i18n keys `scheduledNotif.*` added (en + de).

## Later

- Outlook / Microsoft Graph calendar integration (same `Integration` model, different provider string).
- Write-back: push meetings created in See-Sweet to Google Calendar.
- Gmail integration: thread summarization, action item extraction from emails.
- User timezone awareness for cron scheduling (currently all times are UTC; a per-user `timezone` preference field would eliminate off-by-one on briefing delivery).
- QR code on the Contact Card share page (carried over from refactor-2 Later).
