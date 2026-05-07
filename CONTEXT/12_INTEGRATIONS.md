# 13 - Integrations

Last updated: 2026-05-07

Read this before adding or changing an external provider such as Google Calendar, Google Drive, Gmail, Microsoft Graph, Slack, GitHub, Jira, or Notion.

## Purpose

Integrations connect Princeps features to external user accounts. They are product capabilities, not login providers.

Keep this separation clear:

- Better Auth `Account` rows are for authentication and social login.
- Princeps `Integration` rows are for feature access tokens used after login.
- Every integration is scoped to one authenticated `userId`.
- Provider names are stable lower-snake strings, for example `google_calendar` and `google_drive`.

The current live providers are:

- `google_calendar`: syncs Calendar events into Meetings and can push Princeps meetings back to Google Calendar.
- `google_drive`: lists supported Drive files and imports selected files into the Knowledge Base.

## Main Files

```text
prisma/schema.prisma                         Integration + external source fields
docs/03_FEATURES_REFERENCE.md                Human feature map
docs/04_DEVELOPER_PLAYBOOK.md                Human provider checklist
lib/integrations/shared/token.ts             Token lookup, refresh, and integration errors
lib/integrations/shared/upsert.ts            OAuth upsert + lastSyncedAt helper
lib/integrations/google-calendar/client.ts   OAuth client, scopes, token exchange
lib/integrations/google-calendar/sync.ts     Calendar -> Meeting import
lib/integrations/google-calendar/events.ts   Meeting -> Calendar best-effort writes
lib/integrations/google-drive/client.ts      Drive OAuth client, scopes, token exchange
lib/integrations/google-drive/index.ts       Drive listing, extraction, Knowledge import
app/api/integrations/route.ts                Lists connected integrations for settings
app/api/integrations/<provider>/*/route.ts   Provider connect/callback/disconnect/actions
components/settings/IntegrationsTab.tsx      Supported provider list
components/settings/IntegrationCard.tsx      Provider card, connect, sync, disconnect
app/(app)/settings/page.tsx                  Loads initial integration rows
app/(app)/meetings/page.tsx                  Passes hasGoogleCalendar to MeetingsShell
app/(app)/knowledge/page.tsx                 Passes driveConnected to KnowledgePageClient
components/knowledge/DriveFileBrowser.tsx    Drive list/import client UI
```

All `lib/integrations/*` modules are server-only. Never import provider clients or `@/lib/db` into client components.

## Data Model

`Integration` stores one row per `(userId, provider)`:

```prisma
model Integration {
  userId       String
  provider     String
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  lastSyncedAt DateTime?

  @@unique([userId, provider])
}
```

Provider-specific dedupe/source data lives on the feature record that receives the imported data:

- `Meeting.source`: open string such as `manual`, `llm`, `google_calendar`, future `microsoft_outlook`.
- `Meeting.googleEventId`: unique external event ID for Google Calendar dedupe and write-back.
- `KnowledgeDocument.sourceType`: open string such as `drive` or `null` for manual upload.
- `KnowledgeDocument.sourceId`: external file ID for dedupe/reimport.
- `KnowledgeDocument.sourceUpdatedAt`: external modified time.

Prefer open strings for provider/source identifiers unless the value set is truly fixed. Integrations are expected to grow.

## OAuth Flow

Each provider owns its own API folder under `app/api/integrations/<route-slug>/`.

Standard shape:

```text
GET    /connect       authenticate, create state, set httpOnly cookie, redirect to provider
GET    /callback      authenticate, verify state, exchange code, upsert Integration, redirect settings
DELETE /disconnect    authenticate, delete Integration row
POST   /sync          authenticate, delegate to provider sync/list action when needed
POST   /import        authenticate, delegate to provider import action when needed
```

Current routes:

```text
app/api/integrations/google-calendar/connect/route.ts
app/api/integrations/google-calendar/callback/route.ts
app/api/integrations/google-calendar/disconnect/route.ts
app/api/integrations/google-calendar/sync/route.ts

app/api/integrations/google-drive/connect/route.ts
app/api/integrations/google-drive/callback/route.ts
app/api/integrations/google-drive/disconnect/route.ts
app/api/integrations/google-drive/sync/route.ts
app/api/integrations/google-drive/import/route.ts
```

State cookies are provider-specific:

- Calendar: `oauth_state_google`
- Drive: `oauth_state_google_drive`

Use unique state cookies for new providers so two OAuth flows cannot collide.

Google env vars:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI        # Calendar callback
GOOGLE_DRIVE_REDIRECT_URI  # Drive callback
```

## Token Lifecycle

Use `getValidToken(userId, provider, refreshFn)` from `lib/integrations/shared/token.ts`.

Behavior:

- Loads the `Integration` row by `(userId, provider)`.
- Throws `IntegrationNotFoundError` when the provider is not connected.
- Refreshes when `expiresAt` is within 5 minutes.
- Requires a refresh token for refresh; otherwise throws `IntegrationExpiredError`.
- Writes the refreshed access token and expiry back to `Integration`.

Use `upsertIntegration()` after OAuth callback and `markSynced()` only after a successful sync/list operation.

Current Google auth URLs use `access_type: "offline"` and `prompt: "consent"` so Google returns a refresh token.

## Settings UI

Settings shows all supported providers, whether connected or not.

Update both places when adding a provider:

```text
components/settings/IntegrationsTab.tsx      ALL_PROVIDERS
components/settings/IntegrationCard.tsx      PROVIDER_META
```

`IntegrationCard` currently hardcodes provider labels and descriptions. New user-facing provider copy should be moved to `messages/de.json` and `messages/en.json` when touching this area.

Important route caveat:

```ts
provider.replace("_", "-")
```

This only replaces the first underscore. It works for `google_calendar` and `google_drive`, but future providers with more underscores should use an explicit route slug helper or explicit metadata field.

## Google Calendar

Provider string: `google_calendar`

Files:

```text
lib/integrations/google-calendar/client.ts
lib/integrations/google-calendar/sync.ts
lib/integrations/google-calendar/events.ts
app/api/integrations/google-calendar/*
```

Scopes:

```text
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
```

Calendar sync imports external events into `Meeting` rows:

- Sync window is 30 days back and 365 days forward.
- Imported rows use `source: "google_calendar"` and `kind: "appointment"`.
- `googleEventId` dedupes existing imported events.
- Cancelled Google events delete matching imported Princeps meetings.
- Attendees are resolved into `Contact` rows by email; missing contacts are created.
- New imported rows respect the `meetingsMax` tier cap.
- Existing imported rows update schedule/location/agenda/participants, but do not overwrite `summary`, `prepPack`, or `kind`.
- `lastSyncedAt` is touched only when sync completes without errors.

Meeting create/update/delete has best-effort Google side effects:

- `createMeeting(..., pushToGoogle: true)` creates a Google event and stamps `googleEventId`.
- Updating a linked meeting patches the Google event.
- Updating an unlinked meeting with `pushToGoogle` creates the Google event.
- Deleting a linked meeting deletes the Google event; 404/410 from Google are ignored.
- If Google write-back fails, the local Princeps change still succeeds.

## Google Drive

Provider string: `google_drive`

Files:

```text
lib/integrations/google-drive/client.ts
lib/integrations/google-drive/index.ts
app/api/integrations/google-drive/*
components/knowledge/DriveFileBrowser.tsx
```

Scope:

```text
https://www.googleapis.com/auth/drive.readonly
```

Drive does not automatically index files during settings sync. It lists supported files, then the user imports one file at a time from the Knowledge page.

Supported import sources:

- Google Docs exported as `text/plain`.
- Google Sheets exported as `text/csv`.
- Google Slides exported as `text/plain`.
- PDFs parsed with `pdf-parse`.

Import behavior:

- Lists non-trashed supported files and marks whether each file is already imported.
- Truncates extracted text to `100_000` characters per file.
- Rejects files with less than 50 extracted characters.
- Enforces Knowledge upload/character quotas before indexing.
- Deletes the previous `KnowledgeDocument` with the same Drive source before reimport.
- Chunks text, embeds chunks, stores `KnowledgeDocument` and `KnowledgeChunk` rows in a transaction.
- Increments `User.knowledgeCharsUsed` and `User.knowledgeUploadsUsed`.
- Uses `sourceType: "drive"`, `sourceId: fileId`, and `sourceUpdatedAt`.

Settings hides the generic sync button for Drive with `showSyncButton: false`; Drive listing happens inside the Knowledge UI.

## Adding A Provider

Checklist:

1. Choose a stable provider string, for example `microsoft_outlook`, `gmail`, `slack`, or `notion`.
2. Decide which Princeps feature owns the imported data: Meetings, Tasks, Contacts, Knowledge, Notifications, or a new feature.
3. Add `lib/integrations/<provider>/client.ts` with OAuth/client creation and token exchange.
4. Add provider actions such as `sync.ts`, `events.ts`, `import.ts`, or `messages.ts`.
5. Add routes under `app/api/integrations/<route-slug>/`.
6. Use `auth.api.getSession()` in every route and delegate business logic to `lib/integrations/<provider>/`.
7. Use a provider-specific OAuth state cookie.
8. Store tokens with `upsertIntegration()` and read them with `getValidToken()`.
9. Add settings UI metadata and provider list entries.
10. Add i18n strings for user-facing provider names, descriptions, errors, and toasts.
11. Add connected flags to feature pages that need conditional UI.
12. Add feature-specific source/dedupe fields if generic `sourceType/sourceId` is not enough.
13. Apply tier gates and usage counters before importing or creating records.
14. Update LLM tools/context if the assistant should know about or use the integration.
15. Add notifications only when the integration creates a meaningful user-facing event.
16. Update `docs/` for the developer manual and this file for agent guidance.

## Future Providers

Likely directions:

- Gmail: import or search email context for briefings, contacts, and tasks. Do not mix it into `google_calendar`; use a separate provider string unless the product intentionally creates one combined Google integration.
- Microsoft Graph: Outlook Calendar, OneDrive, and email. Treat each capability separately unless one combined UX is chosen.
- Slack/Teams: knowledge import, task extraction, meeting context, notifications.
- GitHub/Jira/Linear: tasks, decisions, project signals, reports.
- Notion/SharePoint/Confluence: knowledge import and source-aware search.

For provider families, decide early whether the UX is one broad account connection or one connection per capability. The data model supports either by using provider strings such as `google_drive`, `google_calendar`, `microsoft_outlook`, and `microsoft_onedrive`.

## Safety Rules

- Never expose access tokens or refresh tokens to the client.
- Keep provider clients and token refresh server-only.
- Authenticate every route and filter all DB reads/writes by `userId`.
- Request the smallest provider scopes that support the feature.
- Verify OAuth state before token exchange.
- Disconnect currently deletes only the `Integration` row; synced/imported Princeps data stays unless the feature explicitly deletes it.
- Tokens are currently stored in DB fields. Before serious multi-user production, add encryption at rest or a secrets vault strategy.
- Do not let imported external data bypass normal tier limits, ownership checks, or validation.

## Quick References

Use these examples when building the next integration:

- Best OAuth route reference: Google Drive.
- Best feature sync reference: Google Calendar.
- Best import/indexing reference: Google Drive.
- Best two-way side-effect reference: Meetings with Google Calendar.
- Best connected-settings reference: `components/settings/IntegrationsTab.tsx`.
