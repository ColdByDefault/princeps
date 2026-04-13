# Google Calendar Integration

> **Status:** Implemented — April 2026
> **Branch:** `feat/external-tools`
> **Parent doc:** `docs/13_integrations.md`

Full bidirectional sync between Princeps Meetings and the user's primary Google Calendar.
Imported events can be edited and deleted from Princeps and changes are pushed back to Google in real time.

---

## Concept summary

| Direction                  | Trigger                                                             | What happens                                                         |
| -------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Google → Princeps          | Manual "Sync" in Settings / Refresh in Meetings                     | Events are upserted as `Meeting` rows (`source = "google_calendar"`) |
| Princeps → Google (create) | User ticks "Also create in Google Calendar" when creating a meeting | Event is created on Google; `googleEventId` is stamped on the row    |
| Princeps → Google (edit)   | User edits any meeting whose `googleEventId` is set                 | Google event is patched with the new title, time, location, agenda   |
| Princeps → Google (delete) | User deletes any meeting whose `googleEventId` is set               | Google event is deleted; 404/410 from Google is silently ignored     |

All Google pushes are **best-effort**: if the Google API call fails, the Princeps operation still succeeds. No user-visible error is raised for Google-side failures.

---

## Data model

### `Meeting` (relevant fields only)

```prisma
model Meeting {
  source        String   @default("manual")
  // "manual" | "llm" | "google_calendar" | "microsoft_outlook" | …
  googleEventId String?  @unique
  // set on every event imported from or pushed to Google Calendar
}
```

- `googleEventId` is the Google Calendar event ID (e.g. `abc123xyz`).
- Uniqueness constraint prevents duplicate imports of the same event.
- `source = "google_calendar"` is set both on synced events and on meetings created in Princeps with "push to Google" enabled.

### `Integration`

```prisma
model Integration {
  id           String    @id @default(cuid())
  userId       String
  provider     String    // "google_calendar"
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([userId, provider])
  @@map("integration")
}
```

One row per `(userId, provider)` pair. Upserted on every successful OAuth callback.
Deleted on disconnect (synced meetings are **not** deleted).

---

## Environment variables

| Variable               | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | OAuth 2.0 client ID from Google Cloud Console                                    |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret                                                          |
| `GOOGLE_REDIRECT_URI`  | Must match exactly: `https://<domain>/api/integrations/google-calendar/callback` |

---

## File layout

```
lib/integrations/
  shared/
    token.ts                     getValidToken() — reads + auto-refreshes any integration token
    upsert.ts                    upsertIntegration() / markSynced()
  google-calendar/
    client.ts                    OAuth2 client factory, buildGoogleAuthUrl(), exchangeGoogleCode()
    sync.ts                      syncGoogleCalendar() — Google → Princeps full sync
    events.ts                    createCalendarEvent() / updateCalendarEvent() / deleteCalendarEvent()

app/api/integrations/
  route.ts                       GET  — list active integrations for current user
  google-calendar/
    connect/route.ts             GET  — redirect to Google OAuth consent screen
    callback/route.ts            GET  — exchange code, upsert Integration row
    disconnect/route.ts          DELETE — remove token row; leave synced meetings intact
    sync/route.ts                POST — trigger manual Google → Princeps sync

lib/meetings/
  schemas.ts                     createMeetingSchema includes pushToGoogle: boolean (optional)
  create.logic.ts                calls createCalendarEvent() when pushToGoogle is true
  update.logic.ts                calls updateCalendarEvent() when meeting.googleEventId is set
  delete.logic.ts                calls deleteCalendarEvent() when meeting.googleEventId is set

components/
  meetings/
    CreateMeetingDialog.tsx      "Also create in Google Calendar" checkbox (visible when connected)
    logic/
      useMeetingMutations.ts     passes pushToGoogle through to POST /api/meetings
  settings/
    IntegrationsTab.tsx          renders IntegrationCard for every provider in ALL_PROVIDERS
    IntegrationCard.tsx          connect / sync / disconnect UI for a single provider
```

---

## OAuth flow

```
1. User clicks "Connect" in Settings → Integrations
2. GET /api/integrations/google-calendar/connect
   ├── Verify user session
   ├── Generate 24-byte hex CSRF state token
   ├── Store state in httpOnly cookie "oauth_state_google" (10-min TTL)
   └── Redirect to Google OAuth consent URL (scopes below)

3. Google redirects → /api/integrations/google-calendar/callback?code=...&state=...
   ├── Verify user session
   ├── Validate state cookie matches query param (CSRF check); delete cookie
   ├── exchangeGoogleCode(code) → { accessToken, refreshToken, expiresAt }
   ├── upsertIntegration({ userId, provider, accessToken, refreshToken, expiresAt })
   └── Redirect to /settings?connected=google_calendar

4. Settings page detects ?connected=google_calendar and shows "Connected" badge
```

**OAuth scopes requested:**

- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`

`prompt: "consent"` + `access_type: "offline"` ensure a refresh token is always returned.

**Error redirects from callback:**

| Reason                | Redirect destination                           |
| --------------------- | ---------------------------------------------- |
| User denied access    | `/settings?integration_error=access_denied`    |
| Missing code or state | `/settings?integration_error=invalid_callback` |
| CSRF state mismatch   | `/settings?integration_error=state_mismatch`   |
| Token exchange failed | `/settings?integration_error=token_exchange`   |

---

## Token refresh

`lib/integrations/shared/token.ts` — `getValidToken(userId, provider, refreshFn)`

- Reads the `Integration` row for the given `(userId, provider)`.
- If `expiresAt` is within **5 minutes**, calls `refreshFn(refreshToken)`.
- Writes the new `accessToken` and `expiresAt` back to the DB.
- Throws `IntegrationNotFoundError` if no row exists (user not connected).
- Throws `IntegrationExpiredError` if refresh fails (user must reconnect).

---

## Sync: Google → Princeps

**Trigger:** `POST /api/integrations/google-calendar/sync` — called manually from the Meetings page "Refresh" button (when connected) and from the Settings → Integrations card "Sync now" button.

**Window:** events from **30 days in the past** to **365 days in the future** (rolling, calculated at sync time).

**Logic (`lib/integrations/google-calendar/sync.ts`):**

1. Fetch user's tier to enforce `meetingsMax` cap.
2. Authenticate via `getCalendarClient(userId)` (auto-refreshes token if needed).
3. Page through `calendar.events.list` with `showDeleted: true`, `singleEvents: true`.
4. For each event:
   - **Cancelled/deleted on Google** → `deleteMany` the corresponding `Meeting` row (by `googleEventId + userId`).
   - **No summary or no start dateTime** → skip (all-day events are excluded).
   - **Existing row** (`googleEventId` known) → update `title`, `scheduledAt`, `durationMin`, `location`, `agenda`, `status`; replace all `MeetingParticipant` rows.
   - **New event** → check tier cap before inserting; create `Meeting` row with `kind=appointment`, `source=google_calendar`, `googleEventId` stamped.
5. For attendees: for each attendee with an email (excluding `self`), find or create a `Contact` row and link via `MeetingParticipant`.
6. `markSynced()` is called only if zero errors occurred.

**`SyncResult` shape:**

```ts
{ created: number; updated: number; skipped: number; errors: string[] }
```

---

## Write-back: Princeps → Google

All three operations live in `lib/integrations/google-calendar/events.ts`.
They call `getCalendarClient(userId)`, which auto-refreshes the token.
All are best-effort — exceptions are caught and swallowed at the call site.

### `createCalendarEvent(userId, input)`

Called from `lib/meetings/create.logic.ts` when `input.pushToGoogle === true`.

- Creates an event on the user's primary calendar via `calendar.events.insert`.
- End time = `scheduledAt + durationMin`; defaults to `+1 hour` if `durationMin` is null.
- On success, patches the `Meeting` row with the returned `googleEventId` and sets `source = "google_calendar"`.

### `updateCalendarEvent(userId, googleEventId, data)`

Called from `lib/meetings/update.logic.ts` after every successful update **if `meeting.googleEventId` is set** (i.e., the meeting was either synced from Google or created via "push to Google").

- Uses `calendar.events.patch` — only touches `summary`, `location`, `description`, `start`, `end`.
- Fields not exposed in the Princeps edit form (e.g. Google attendees list) are left untouched.

### `deleteCalendarEvent(userId, googleEventId)`

Called from `lib/meetings/delete.logic.ts` after a successful Princeps deletion **if `googleEventId` was set on the meeting**.

- `googleEventId` is read before the DB deletion so it's still available.
- HTTP 404 and 410 from Google are silently swallowed (event already gone on Google's side).

---

## UI

### Settings → Integrations (`/settings` → Integrations tab)

`components/settings/IntegrationsTab.tsx` + `IntegrationCard.tsx`

- Lists all providers defined in `ALL_PROVIDERS = ["google_calendar"]`.
- **Not connected:** shows a "Connect" anchor that navigates to `/api/integrations/google-calendar/connect`.
- **Connected:** shows "Connected" badge, last synced timestamp, "Sync now" button, "Disconnect" button.
- Disconnect calls `DELETE /api/integrations/google-calendar/disconnect` — removes the token row; **synced meetings are not deleted**.
- Sync now calls `POST /api/integrations/google-calendar/sync` and updates `lastSyncedAt` in local state.

### Meetings page — create

`components/meetings/CreateMeetingDialog.tsx`

- When `hasGoogleCalendar={true}` prop is passed, a checkbox labelled **"Also create in Google Calendar"** appears at the bottom of the form before the footer buttons.
- Checked state is stored in local `pushToGoogle` boolean, reset to `false` on dialog close.
- The value is passed through `useMeetingMutations.createMeeting()` → `POST /api/meetings` body → `createMeetingSchema.pushToGoogle` → `create.logic.ts`.

`hasGoogleCalendar` comes from the server page (`app/(app)/meetings/page.tsx`), which checks `db.integration.findFirst` at render time.

### Meetings page — edit / delete

No UI change. Edit and delete push-back to Google is **automatic and silent**:

- Editing a Google-linked meeting saves to Princeps first, then patches Google.
- Deleting a Google-linked meeting removes from Princeps first, then deletes from Google.
- The user does not see a separate prompt or confirmation.

---

## Adding a new provider

1. Create `lib/integrations/<provider>/client.ts` and `sync.ts` (and optionally `events.ts`).
2. Add OAuth routes under `app/api/integrations/<provider>/connect|callback|disconnect|sync/`.
3. Add the provider key to `ALL_PROVIDERS` in `components/settings/IntegrationsTab.tsx`.
4. Add an entry to `PROVIDER_META` in `components/settings/IntegrationCard.tsx`.
5. No changes needed to `lib/integrations/shared/` — token and upsert helpers are provider-agnostic.
