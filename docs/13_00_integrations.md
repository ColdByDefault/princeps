# Integrations

> **Status:** Planned — April 2026
> **Branch:** `feat/external-tools`

External integrations allow users to connect third-party services to Princeps. Connected services sync data into the existing feature models (Meetings, Tasks, Contacts, etc.) and can be disconnected at any time without affecting the user's Princeps account.

---

## Concept

Integrations are **not** social login. The user authenticates into Princeps with email/password. Separately, they can connect external services to pull in data. Each connected service is stored as an `Integration` row and has an independent token lifecycle.

```
User account (Better Auth → account table)  ← for identity only
Integration token (integration table)       ← for data access
```

These two are fully decoupled. Revoking a Google Calendar integration does not affect the user's ability to log in.

---

## Data Model — already in `prisma/schema.prisma`

```prisma
model Integration {
  id           String    @id @default(cuid())
  userId       String
  provider     String    // "google_calendar" | "github" | "slack" | ...
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@map("integration")
}
```

One row per `(userId, provider)` pair. Upserted on every successful OAuth callback.

---

## File Layout — one provider = one folder

```
lib/integrations/
  shared/
    token.ts              Read + auto-refresh token for any provider
    upsert.ts             Save/update Integration row (shared by all callbacks)
  google-calendar/
    client.ts             Returns authenticated google-auth-library OAuth2Client
    sync.ts               Fetch events → upsert Meeting rows
  github/
    client.ts             Returns Octokit instance with stored token
    sync.ts               Fetch issues/PRs → upsert Task rows
  slack/
    client.ts             Returns WebClient with stored token
    notify.ts             Send a message to a Slack channel
  <provider>/
    client.ts
    sync.ts

app/api/integrations/
  [provider]/
    connect/route.ts      GET  → redirect to provider OAuth consent screen
    callback/route.ts     GET  → exchange code for tokens, upsert Integration row
    disconnect/route.ts   DELETE → delete Integration row, optionally scrub synced data
    sync/route.ts         POST → trigger manual sync for this provider
```

UI lives in `app/(app)/settings/` under an **Integrations** tab (already has a settings page).

```
components/settings/
  IntegrationsPanel.tsx   List of providers with Connect/Disconnect/Last synced
  IntegrationCard.tsx     Single provider card
```

---

## OAuth Flow (per provider)

```
1. User clicks "Connect" in Settings → Integrations
2. GET /api/integrations/[provider]/connect
   - Build the OAuth consent URL with scopes
   - Store a CSRF state token in a signed cookie
   - Redirect to provider
3. Provider redirects back to /api/integrations/[provider]/callback?code=...&state=...
   - Verify state cookie (CSRF check)
   - Exchange code for access + refresh tokens
   - Upsert into integration table
   - Redirect to /settings?connected=[provider]
4. Settings page shows provider as "Connected" + last synced time
```

### Disconnect

```
DELETE /api/integrations/[provider]/disconnect
- Auth check
- Delete Integration row
- Optionally null out provider-specific FKs (e.g. Meeting.googleEventId)
- Redirect / return 204
```

---

## Token Lifecycle — `lib/integrations/shared/token.ts`

```ts
// Returns a valid access token, refreshing if within 5 min of expiry.
// Throws IntegrationExpiredError if refresh fails (user must reconnect).
async function getValidToken(userId: string, provider: string): Promise<string>;
```

All `client.ts` files call `getValidToken` before constructing the API client. They never receive raw credentials directly.

---

## Sync Logic — `lib/integrations/[provider]/sync.ts`

Each sync file follows the same contract:

```ts
export async function sync(userId: string): Promise<SyncResult>;

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}
```

Sync is **upsert-only** — never deletes Princeps data when a remote item disappears. The user decides what to do with orphaned records.

Provider-specific FK fields on existing models are used for deduplication:

- `Meeting.googleEventId` — Google Calendar event ID (rename to `externalEventId` once Microsoft Calendar is added)

Future providers will add similar FK fields on the relevant model as needed.

---

## Meeting Model — `kind` + `source`

The `Meeting` model carries two new fields to distinguish what an event is and where it came from.

### `kind` — closed enum (fixed concept)

```prisma
enum EventKind {
  meeting      // full Princeps record — participants, prep pack, tasks, decisions
  appointment  // lightweight — title, time, location, notes only
}
```

`meeting` unlocks: `agenda`, `prepPack`, `summary`, participants, linked tasks + decisions.
`appointment` keeps all of those nullable/empty. The user can "promote" any appointment to a full meeting.

### `source` — plain `String` (open-ended, never an enum)

```prisma
source  String  @default("manual")
```

Known values at this point:

| Value                 | Meaning                                |
| --------------------- | -------------------------------------- |
| `"manual"`            | Created by the user in Princeps UI     |
| `"llm"`               | Created by the assistant via tool call |
| `"google_calendar"`   | Synced from Google Calendar            |
| `"microsoft_outlook"` | Synced from Microsoft Graph (future)   |
| `"apple_calendar"`    | Future                                 |

Using a plain string (same pattern as `Integration.provider`) means adding a new calendar source requires **zero schema migrations** — just a new provider folder in `lib/integrations/`.

### Default sync behaviour

Google Calendar (and any future calendar provider) always imports events as:

- `kind = appointment`
- `source = "google_calendar"` (or the provider's string)

The user promotes to `kind = meeting` manually from the calendar view or meetings list.

### UI distinction

|         | `meeting`                  | `appointment`                        |
| ------- | -------------------------- | ------------------------------------ |
| Icon    | `Users`                    | `CalendarDays`                       |
| Badge   | —                          | provider name if `source ≠ "manual"` |
| Actions | Prep Pack, Add Participant | Promote to Meeting                   |

---

## Sync Triggers

| Trigger       | How                                                          |
| ------------- | ------------------------------------------------------------ |
| Manual        | POST `/api/integrations/[provider]/sync` from Settings UI    |
| On login      | Check `lastSyncedAt`; if > threshold, queue a sync           |
| Cron (future) | `app/api/cron/` job calling sync for all active integrations |

---

## Scopes — Request Only What's Needed

Each provider section below lists the minimum scopes required.

---

## Providers

### Google Calendar

- **Scopes:** `calendar.readonly` (read events) + `calendar.events` (create/update events from Princeps)
- **Syncs into:** `Meeting` (`kind=appointment`, `source="google_calendar"`, deduped by `googleEventId`)
- **Library:** `googleapis` npm package
- **Refresh:** Google issues long-lived refresh tokens; standard token refresh flow
- **Note:** Same OAuth app used for Gmail — additional scopes added to the same consent screen

### Gmail (future)

- **Scopes:** `https://www.googleapis.com/auth/gmail.readonly`
- **Syncs into:** TBD — likely `Contact` last contact date, or a new `Email` model
- **Note:** Same OAuth app as Google Calendar (additional scope on same consent screen)

### GitHub

- **Scopes:** `repo` (or `public_repo` for public only), `read:user`
- **Syncs into:** `Task` (issues assigned to user)
- **Library:** `@octokit/rest`
- **Refresh:** GitHub tokens do not expire (no refresh needed for classic tokens); GitHub Apps use short-lived tokens with refresh

### Microsoft Graph (Outlook + Teams)

- **Scopes:** `Calendars.Read`, `Mail.Read`, `Chat.Read`
- **Syncs into:** `Meeting` (calendar events), future email/message models
- **Library:** `@microsoft/microsoft-graph-client`
- **Refresh:** Standard OAuth 2.0 refresh token flow via Azure AD

### Slack

- **Scopes:** `channels:read`, `chat:write` (for notifications out)
- **Syncs into:** no inbound sync; used for outbound notifications
- **Library:** `@slack/web-api`

### Jira (Atlassian)

- **Scopes:** `read:jira-work`, `read:jira-user`
- **Syncs into:** `Task` (Jira issues assigned to user)
- **Library:** REST API (no official Node SDK needed; plain `fetch`)
- **Notes:** Uses Atlassian OAuth 2.0 (3LO); `cloudId` is required and retrieved post-auth from `/oauth/token/accessible-resources`

### Notion (future)

- **Scopes:** `read_content`
- **Syncs into:** `KnowledgeDocument` (Notion pages as knowledge chunks)

---

## Security Rules

- Access tokens are stored as plaintext in the DB for now. If the DB is behind a private network (Docker / Supabase RLS), this is acceptable for a private single-user app. For multi-user production: encrypt at rest using a server-side key (e.g. AES-GCM via Node `crypto`).
- CSRF state token on every OAuth initiation — validated on callback.
- All callback and sync routes require an authenticated session. No token is ever returned to the client.
- Scopes are read-only wherever possible. Write scopes only when the feature explicitly needs to create/update provider data (e.g. creating a Google Calendar event from a Meeting).

---

## UI — Settings → Integrations

Each provider shows a card:

```
[Provider logo]  Google Calendar
                 Sync meetings from your Google Calendar
                 Last synced: 5 minutes ago

                 [Sync now]  [Disconnect]
```

- **Not connected:** shows `[Connect]` button only
- **Connected:** shows last synced time, `[Sync now]`, `[Disconnect]`
- Connection errors (expired token, revoked access) show an inline warning with a `[Reconnect]` link

Strings go in `messages/de.json` and `messages/en.json` under `Settings.Integrations.*`.

---

## Implementation Order (suggested)

1. **Google Calendar** — highest value, schema already has `googleEventId`, one Google OAuth app covers Gmail too
2. **GitHub** — straightforward API, no token expiry complexity
3. **Microsoft Graph** — covers Outlook + Teams + Calendar in one OAuth app
4. **Slack** — outbound notifications first, no inbound sync needed
5. **Jira** — useful for technical users, slightly more complex (cloudId lookup)
6. **Notion** — knowledge sync, lower priority
