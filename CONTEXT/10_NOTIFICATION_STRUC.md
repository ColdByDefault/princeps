# 10 - Notification Structure

Last updated: 2026-05-07

Read this before changing notifications, greetings, overdue nudges, report notices, weather-backed greetings, or notification UI.

## Purpose

Notifications are the app's persistent assistant inbox. They are user-scoped records used for:

- Daily LLM greetings.
- Proactive overdue-task nudges.
- System notices such as generated assistant reports.
- Future assistant/system events.

They are not global broadcasts. Every notification belongs to one authenticated user.

## Data Model

`prisma/schema.prisma`:

```prisma
model Notification {
  id        String
  userId    String
  category  String
  source    NotificationSource // assistant | system
  title     String
  body      String
  read      Boolean
  dismissed Boolean
  metadata  Json?
  createdAt DateTime
}
```

Important behavior:

- `dismissed` is soft-delete. Do not hard-delete unless explicitly requested.
- List queries return `dismissed: false`, newest first, max 50.
- Ownership is always enforced with `userId`.
- `metadata.date` is used for once-per-day notification cooldowns.

## Main Files

```text
prisma/schema.prisma
types/api.ts                              NotificationRecord
lib/features/notifications/index.ts                Barrel exports
lib/features/notifications/shared.logic.ts         Select + mapper + date helpers
lib/features/notifications/list.logic.ts           List non-dismissed notifications
lib/features/notifications/mark-read.logic.ts      Read mutations
lib/features/notifications/delete.logic.ts         Soft-delete mutations
lib/features/notifications/greeting.logic.ts       Daily LLM greeting
lib/features/notifications/nudge-overdue.logic.ts  Overdue-task cron nudges
app/api/notifications/route.ts
app/api/notifications/[id]/route.ts
app/api/notifications/greeting/route.ts
app/api/cron/tasks-overdue/route.ts
hooks/use-notifications.ts
components/notifications/NotificationBell.tsx
components/notifications/NotificationDrawer.tsx
components/notifications/NotificationItem.tsx
lib/services/weather/fetch.ts
lib/services/weather/timezone-coords.ts
lib/services/weather/location-coords.ts
```

All `lib/features/notifications/*` logic is server-only.

## API Routes

```text
GET    /api/notifications
       -> listNotifications(userId)

DELETE /api/notifications
       -> deleteAllNotifications(userId)

PATCH  /api/notifications/[id]
       -> markNotificationRead(userId, id)

DELETE /api/notifications/[id]
       -> deleteNotification(userId, id)

POST   /api/notifications/greeting
       -> generateDailyGreeting(userId)

POST   /api/cron/tasks-overdue
       -> bearer CRON_SECRET
       -> runOverdueTaskNudges()
```

Current implementation does not have `/api/notifications/stream`. Client refresh is fetch-based, with a `notifications:refresh` browser event for chat-triggered refreshes.

## Client Flow

`NotificationBell` is rendered in desktop and mobile nav.

```text
NotificationBell
  -> useNotifications()
  -> NotificationDrawer
  -> NotificationItem
```

`useNotifications`:

- Loads notifications from `GET /api/notifications`.
- Fires `POST /api/notifications/greeting` once per browser tab session.
- Uses `sessionStorage["ss-greeting-fired"]` so duplicate desktop/mobile bells do not double-trigger greetings.
- Shows a Sonner toast when a new greeting is created.
- Optimistically marks single notifications read.
- Optimistically soft-deletes one or all notifications.
- Listens for `window` event `notifications:refresh` and refetches.

`NotificationBell` marks unread notifications as read when the drawer closes by PATCHing each unread item.

## Daily Greeting

`generateDailyGreeting(userId)` creates `category: "daily_greeting"` notifications.

Flow:

```text
POST /api/notifications/greeting
  -> findTodayGreeting(userId)
  -> load user name, timezone, preferences
  -> check notificationsEnabled
  -> fetchWeather()
  -> list open + in_progress tasks
  -> callChat()
  -> accumulateTokens()
  -> create Notification
```

Rules:

- One greeting per UTC day unless `FORCE_GREETING=true`.
- `preferences.notificationsEnabled === false` disables it before any weather or LLM work.
- Language defaults to German unless `preferences.language` is English.
- Weather is optional; failures silently produce a greeting without weather.
- Greeting LLM usage counts against monthly token counters.

Greeting prompt changes belong in `lib/features/notifications/greeting.logic.ts`.

## Weather Context

Weather supports Home and daily greetings.

```text
fetchWeather(timezone, locationData?)
  -> prefer saved city coordinates from User.preferences
  -> fallback to timezone coordinate map
  -> Open-Meteo forecast endpoint
  -> WeatherSnapshot | null
```

No user ID or IP is sent to Open-Meteo. Only coordinates are sent server-side. Open-Meteo requires no API key.

Saved location fields live in `User.preferences`:

```text
location
locationLat
locationLon
```

Timezone lives on `User.timezone`.

## Overdue Task Nudges

`runOverdueTaskNudges()` creates `category: "overdue_tasks"` notifications from cron.

Flow:

```text
POST /api/cron/tasks-overdue
  -> require Authorization: Bearer CRON_SECRET
  -> load all users
  -> check tier nudge availability
  -> check notificationsEnabled
  -> check overdueTaskNudgesEnabled
  -> one notification per user per UTC day
  -> count overdue open/in_progress tasks
  -> create localized assistant notification
```

These nudges are deterministic. They do not call the LLM and do not consume LLM token quota.

The tier gate is:

```ts
getPlanLimits(user.tier).nudgesEnabled
```

User toggle:

```text
Settings -> Assistant -> Automation -> overdueTaskNudgesEnabled
```

## Report Notifications

`lib/features/reports/create.logic.ts` creates a fire-and-forget notification after assistant tool reports:

```text
category: report_generated
source: system
metadata: { reportId }
```

This is intentionally non-blocking. Report creation should not fail just because notification creation fails.

## Settings

Global assistant-message opt-out:

```text
Settings -> Appearance -> notificationsEnabled
```

This disables LLM greetings and overdue nudges. It does not remove existing notifications.

Overdue nudge opt-out:

```text
Settings -> Assistant -> overdueTaskNudgesEnabled
```

Only meaningful when the user's tier has nudges enabled.

## i18n

User-facing UI strings live in both locale files:

```text
messages/de.json
messages/en.json
```

Main namespaces:

```text
notifications.*
notifications.overdueTasks.*
settings.appearance.notifications*
settings.assistant.overdueTaskNudges*
home.weather.*
```

LLM greeting bodies are generated directly in the user's preferred language, not translated after generation.

## Add A Notification Type

Checklist:

- Pick a stable `category` string.
- Decide `source`: `assistant` for assistant/proactive messages, `system` for app/system events.
- Create notifications only in server logic, never client components.
- Always include `userId`.
- Use `metadata` for small structured details needed for dedup, links, or diagnostics.
- Add localized deterministic copy to both locale files if not LLM-generated.
- If triggered by cron, add `CRON_SECRET` protection and daily/idempotency checks.
- If it should respect user opt-out, check `notificationsEnabled !== false`.
- If it is tiered, check `getPlanLimits()`.
- Refresh the client through normal fetch or `notifications:refresh` if created during an active chat flow.

Keep notification logic small and feature-owned. Cross-feature notification creation can call `db.notification.create`, but complex generation rules belong in `lib/features/notifications/` or the feature's own server logic.
