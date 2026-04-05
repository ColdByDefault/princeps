# Notifications & Weather System


> Important: This document is a work in progress and may not reflect the final implementation. It is intended to provide an overview of the new notifications and weather system architecture and key files, but details are subject to change as development progresses. Please refer to the latest codebase for the most up-to-date information.


> **Status:** Implemented — April 2026
> **Type:** New feature — not a refactor of any existing model

---

## Concept

This is not a typical notification system. It is a **living presence layer** — LLM-generated ambient messages that give the app a human tone. The assistant acknowledges the user when they arrive, references real context (weather, time of day, open work), and stores those messages as a persistent inbox.

Weather is woven in: fetched server-side from a free API using the user's existing `timezone` field, injected into the LLM greeting prompt, and displayed on the Home page.

---

## GDPR / DSGVO

- No IP address is ever sent to a third party.
- No location data is collected or stored.
- Weather coordinates are derived **server-side** from the user's `timezone` field (already in the DB) using a static timezone → lat/lon lookup map.
- Open-Meteo receives only lat/lon coordinates from the server. No user identifier leaves the system.
- No new personal data fields are added.

---

## Data Model

The `Notification` model already exists in `prisma/schema.prisma`. No schema changes needed.

```prisma
model Notification {
  id        String             @id @default(cuid())
  userId    String
  category  String             // "daily_greeting" | "system" | future categories
  source    NotificationSource @default(assistant)
  title     String
  body      String
  read      Boolean            @default(false)
  dismissed Boolean            @default(false)
  metadata  Json?              // { date: "YYYY-MM-DD", weather: { temp, code, label } }
  createdAt DateTime           @default(now())
}
```

`metadata.date` is the UTC date string used for the once-per-day deduplication check.

---

## Weather Layer — `lib/weather/`

### `timezone-coords.ts`

Static map of IANA timezone string → `{ lat: number; lon: number; label: string }`.
Covers all major timezone zones. Falls back to `{ lat: 51.5, lon: 10.0, label: "Germany" }` (geographic center of Germany, the default locale).

### `fetch.ts`

Calls Open-Meteo: `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m,weathercode`

Returns a `WeatherSnapshot`:

```ts
interface WeatherSnapshot {
  temperatureCelsius: number;
  weatherCode: number; // WMO code
  conditionLabel: string; // human-readable: "Clear sky", "Partly cloudy", etc.
  conditionEmoji: string; // ☀️ 🌤 🌧 🌩 ❄️
  location: string; // city/region label from timezone map
}
```

WMO code → label/emoji mapping is a small static lookup in `fetch.ts`.

---

## Notifications Layer — `lib/notifications/`

Five files. All `import "server-only"`.

### `shared.logic.ts`

Exports `NOTIFICATION_SELECT`, `toNotificationRecord()`, `findTodayGreeting(userId)`, and `todayUtc()`.
`findTodayGreeting` queries by `metadata->>'date'` to support the dedup check without loading the full record.

### `list.logic.ts`

`listNotifications(userId)` — returns all non-dismissed notifications, newest first, limit 50.

### `mark-read.logic.ts`

`markNotificationRead(userId, id)` — sets `read: true`. Verifies ownership.
`markAllNotificationsRead(userId)` — bulk update.

### `delete.logic.ts`

`deleteNotification(userId, id)` — sets `dismissed: true` (soft delete, preserves audit trail).
`deleteAllNotifications(userId)` — bulk soft-delete all non-dismissed.

### `greeting.logic.ts`

`generateDailyGreeting(userId)` — the core logic:

1. Load user `name`, `timezone`, `preferences`, and open task count.
2. **Opt-out check**: if `preferences.notificationsEnabled === false`, return `{ created: false, notification: null }` immediately. Defaults to `true` if unset.
3. **Deduplication check**: query `Notification` where `userId`, `category = "daily_greeting"`, and `metadata->>'date' = today_utc`. If found, return early. Skip if `FORCE_GREETING=true` in env (dev override).
4. Fetch `WeatherSnapshot` via `lib/weather/fetch.ts`.
5. Build a short LLM prompt with: user name, local time, weather, open task count. The system prompt explicitly instructs the LLM to **address the user by their first name**.
6. Call `callChat()` from `lib/llm-providers/provider.ts`.
7. **Token tracking**: call `accumulateTokens(userId, promptLength, responseLength)` to increment `UsageCounter.tokenMonthlyCount` — greetings count against the user's monthly quota the same way chat messages do.
8. Store result as `Notification` with `category: "daily_greeting"`, `source: "assistant"`, `metadata: { date, weather }`.
9. Return the created notification.

**To change greeting content / tone**, edit the `systemPrompt` and `userPrompt` arrays in `greeting.logic.ts`. No other files need changing.

---

## API Routes — `app/api/notifications/`

### `route.ts` — `GET`

Auth → `listNotifications(userId)` → return array.

### `route.ts` — `DELETE`

Auth → `deleteAllNotifications(userId)` → `204`.

### `[id]/route.ts` — `PATCH`

Auth → parse id → `markNotificationRead(userId, id)` → return updated record.

### `[id]/route.ts` — `DELETE`

Auth → parse id → `deleteNotification(userId, id)` → `204`.

### `greeting/route.ts` — `POST`

Auth → `generateDailyGreeting(userId)` → return `{ created: boolean, notification: NotificationRecord | null }`.
`created: false` means a greeting already existed for today (client silently no-ops).

---

## Hook — `hooks/use-notifications.ts`

- `notifications` — state array
- `unreadCount` — derived
- `loading`
- `triggerGreeting()` — POST `/api/notifications/greeting` on mount (once per session via `useRef` guard). When a new greeting is created, shows a **Sonner toast** with the greeting title and body.
- `markRead(id)` — PATCH, optimistic update
- `deleteOne(id)` — DELETE, optimistic remove
- `deleteAll()` — DELETE bulk, clear state

---

## Components — `components/notifications/`

### `NotificationBell.tsx`

- Bell icon (Lucide `Bell`) in the Navbar (Desktop + Mobile).
- Red dot badge showing unread count (hidden when 0).
- Clicking opens the Shadcn `Sheet` (right side).
- Calls `triggerGreeting()` from the hook on mount — so the greeting fires when the user first loads any authenticated page.

### `NotificationDrawer.tsx`

- Shadcn `Sheet` with `side="right"`.
- Header: "Notifications" + "Clear all" button.
- Scrollable list of `NotificationItem` components.
- Empty state message when no notifications exist.
- Marks all unread as read when the drawer opens.

### `NotificationItem.tsx`

- Renders `title`, `body`, relative timestamp.
- Unread indicator: left border `border-l-primary/60`.
- Individual delete button (X icon, `cursor-pointer`, `aria-label`). Opacity hidden until hover.

### `index.ts`

Barrel export.

---

## Home Page — `app/(app)/home/page.tsx` + `components/home/`

### Server page

- Computes a **static time-based greeting title** server-side (`buildGreetingTitle`) based on local hour + user language. Example: "Good morning, Max!" / "Guten Abend, Anna!".
- Fetches `WeatherSnapshot` server-side. On error, passes `null` — weather is non-critical.
- Passes `greetingTitle` and `weather` as props to `HomeShell`.

### `components/home/HomeShell.tsx`

- Displays the static time-based greeting (no LLM dependency on this page).
- Displays weather widget: emoji + temperature + condition label + location.
- **Does not import `useNotifications`.** The LLM greeting body lives only in the notification drawer.

---

## User Settings — Notifications Toggle

Users can enable or disable daily greetings in **Settings → Appearance**.

Implementation chain:

- `UserPreferences.notificationsEnabled: boolean | null` — in `lib/settings/user-preferences.logic.ts`
- PATCH `/api/settings` accepts `notificationsEnabled: boolean`
- `components/settings/AppearanceTab.tsx` — Switch toggle with title, description, and a disclaimer: _"Greetings use your monthly token quota."_
- `app/(app)/settings/page.tsx` reads `initialPrefs.notificationsEnabled ?? true` and passes down via `SettingsShell` → `AppearanceTab`

Disabling sets `preferences.notificationsEnabled = false` in the DB. `greeting.logic.ts` checks this before doing any LLM work.

---

## i18n

New namespace `notifications` in both `messages/de.json` and `messages/en.json`.

Implemented keys:

```
notifications.title
notifications.empty
notifications.clearAll
notifications.deleteOne.ariaLabel
notifications.bell.ariaLabel
home.weather.location
home.weather.noWeather
settings.appearance.notificationsTitle
settings.appearance.notificationsDescription
settings.appearance.notificationsDisclaimer
```

LLM-generated greeting bodies are **not translated** — they are generated directly in the user's preferred language by the LLM prompt instructions.

---

## Environment

```env
# .env.local — dev only
FORCE_GREETING=true   # bypasses the once-per-day dedup check
```

No new secrets. Open-Meteo requires no API key.
