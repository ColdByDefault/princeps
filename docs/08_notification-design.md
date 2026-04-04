# Notifications & Weather System

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

### `schemas.ts`

No user-created inputs — notifications are created by the system/LLM only.
Exports `listNotificationsSchema` (query params: `limit`, `dismissed`).

### `list.logic.ts`

`listNotifications(userId)` — returns all non-dismissed notifications, newest first, limit 50.

### `mark-read.logic.ts`

`markRead(userId, id)` — sets `read: true`. Verifies ownership.

### `delete.logic.ts`

`deleteNotification(userId, id)` — sets `dismissed: true` (soft delete, preserves audit trail).
`deleteAllNotifications(userId)` — bulk soft-delete all non-dismissed.

### `greeting.logic.ts`

`generateDailyGreeting(userId)` — the core logic:

1. Load user `name`, `timezone`, open task count.
2. **Deduplication check**: query `Notification` where `userId`, `category = "daily_greeting"`, and `metadata->>'date' = today_utc`. If found, return early. Skip if `FORCE_GREETING=true` in env (dev override).
3. Fetch `WeatherSnapshot` via `lib/weather/fetch.ts`.
4. Build a short LLM prompt with: user name, local time, weather, open tasks count. Ask for a brief warm personal greeting (2–3 sentences max, no bullet points).
5. Call `callChat()` from `lib/llm-providers/provider.ts` with the prompt.
6. Store result as `Notification` with `category: "daily_greeting"`, `source: "assistant"`, `metadata: { date, weather }`.
7. Return the created notification.

---

## API Routes — `app/api/notifications/`

### `route.ts` — `GET`

Auth → `listNotifications(userId)` → return array.

### `route.ts` — `DELETE`

Auth → `deleteAllNotifications(userId)` → `204`.

### `[id]/route.ts` — `PATCH`

Auth → parse id → `markRead(userId, id)` → return updated record.

### `[id]/route.ts` — `DELETE`

Auth → parse id → `deleteNotification(userId, id)` → `204`.

### `greeting/route.ts` — `POST`

Auth → `generateDailyGreeting(userId)` → return `{ created: boolean, notification: NotificationRecord | null }`.
`created: false` means a greeting already existed for today (client silently no-ops).

---

## Hook — `hooks/use-notifications.ts`

Already exists (empty file). Will implement:

- `notifications` — state array
- `unreadCount` — derived
- `loading`
- `triggerGreeting()` — POST `/api/notifications/greeting` on mount (once per session via `useRef` guard)
- `markRead(id)` — PATCH, optimistic update
- `deleteOne(id)` — DELETE, optimistic remove
- `deleteAll()` — DELETE bulk, clear state

---

## Components — `components/notifications/`

### `NotificationBell.tsx`

- Bell icon (Lucide `Bell`) in the Navbar.
- Red dot badge showing unread count (hidden when 0).
- Clicking opens the Shadcn `Sheet` (right side).
- Calls `triggerGreeting()` from the hook on mount — so the greeting fires when the user first lands anywhere in the authenticated layout.

### `NotificationDrawer.tsx`

- Shadcn `Sheet` with `side="right"`.
- Header: "Notifications" + "Clear all" button.
- Scrollable list of `NotificationItem` components.
- Empty state: a short message when no notifications exist.

### `NotificationItem.tsx`

- Renders `title`, `body`, relative timestamp.
- Mark-read on first view (triggered when drawer opens via `markRead`).
- Individual delete button (X icon, `cursor-pointer`, `aria-label`).
- Unread indicator: subtle left border or dot.

### `index.ts`

Barrel export.

---

## Home Page — `app/(app)/home/page.tsx` + `components/home/`

### Server page

- Fetch `WeatherSnapshot` server-side (import from `lib/weather/fetch.ts`).
- Pass to `HomeShell` as prop. On fetch error, pass `null` — weather is non-critical.

### `components/home/HomeShell.tsx`

- Displays weather widget: emoji + temperature + condition label + location.
- Shows today's greeting from the notification store (pulled from hook).
- Replaces the current placeholder `{t("welcome")}`.

---

## i18n

New namespace `notifications` in both `messages/de.json` and `messages/en.json`.

Keys needed:

```
notifications.title
notifications.empty
notifications.clearAll
notifications.clearAll.confirm
notifications.deleteOne.ariaLabel
notifications.bell.ariaLabel
notifications.unread         (e.g. "{{count}} unread")
home.weather.feels           (optional "Feels like...")
home.weather.location
```

LLM-generated greeting bodies are **not translated** — they are generated directly in the user's preferred language by the LLM prompt.

---

## Build Order

1. `lib/weather/timezone-coords.ts` + `fetch.ts`
2. `lib/notifications/` — all 5 files
3. `app/api/notifications/` — all routes
4. `hooks/use-notifications.ts`
5. `components/notifications/` — Bell + Drawer + Item
6. Wire bell into `app/(app)/layout.tsx` (authenticated layout)
7. `components/home/HomeShell.tsx` + update `app/(app)/home/page.tsx`
8. i18n strings — both locales

---

## Environment

```env
# .env.local — dev only
FORCE_GREETING=true   # bypasses the once-per-day dedup check
```

No new secrets. Open-Meteo requires no API key.


>Open Questions:
   - Messages from LLM should be calculated and added to right token usage category.
   - Users can enable/disable this system in settings.
   - add declaration that notifications consume tokens in the same way as chats, so users are aware of the cost implications.
   - do i need env var?