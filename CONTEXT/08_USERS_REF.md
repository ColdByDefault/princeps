# 08 - Users & Settings Reference

Last updated: 2026-05-07

Read this when working on user preferences, `/settings`, language, theme, assistant behavior, tools, usage, integrations, subscription state, or values stored on the `User` row.

Reference areas:

- `app/(app)/settings/page.tsx` loads the settings screen.
- `components/settings/SettingsShell.tsx` owns the tab layout.
- `app/api/settings/route.ts` saves most preferences.
- `lib/settings/user-preferences.logic.ts` parses and persists `User.preferences`.

## User Data Model

The core user record is `User` in `prisma/schema.prisma`.

Important fields:

```text
User.id                 ownership key for all user-scoped records
User.email              login identity
User.name / username    display and account identity
User.timezone           direct column, used by briefings, weather, context
User.tier               free/pro/premium/enterprise
User.preferences        JSON object for most app settings
User.stripeCustomerId   Stripe billing link
User.knowledgeCharsUsed lifetime knowledge quota counter
```

Most settings are stored in `User.preferences` JSON. Timezone is the main exception: it is stored directly in `User.timezone`.

## Preferences Shape

`lib/settings/user-preferences.logic.ts` defines the current preference contract.

Current preference fields:

```text
language
theme
notificationsEnabled
location
locationLat
locationLon
assistantName
assistantTone
addressStyle
responseLength
disabledTools
customSystemPrompt
autoBriefingEnabled
reportsEnabled
overdueTaskNudgesEnabled
```

`parseUserPreferences(raw)` is the normalization boundary. It accepts old stringified JSON or current Prisma JSON objects, validates each value, trims where needed, and returns a safe `UserPreferences` object.

`updateUserPreferences(userId, patch)` merges a partial patch with current preferences and writes a cleaned JSON object back to `User.preferences`.

## Settings Page Load

`app/(app)/settings/page.tsx` is a server page.

It does:

```text
auth
  -> redirect unauthenticated users to /login

Promise.all:
  -> getProviderStatus()
  -> getUserUsage(userId)
  -> getUserPreferences(userId)
  -> db.user.findUnique({ timezone, tier })
  -> db.integration.findMany(...)
  -> TOOL_REGISTRY summary for Tools tab

SettingsShell receives all initial props
```

The active tab is restored from the `settings-tab` cookie and defaults to `appearance`.

## SettingsShell Tabs

`components/settings/SettingsShell.tsx` renders the tabs:

```text
appearance
assistant
tools
usage
provider
integrations
subscription
```

The shell stores only the active tab state. It writes the chosen tab to the `settings-tab` cookie so the same tab opens next time.

Each tab owns its own local state and save behavior.

## Save API

Most settings save through:

```text
PATCH /api/settings
```

`app/api/settings/route.ts`:

- Authenticates the user.
- Parses JSON safely.
- Accepts only known fields.
- Validates enum-like values against constants.
- Trims and caps strings.
- Filters `disabledTools` against `TOOL_REGISTRY`.
- Calls `updateUserPreferences()` for JSON preference fields.
- Calls `updateUserTimezone()` for timezone.
- Calls `updateUserLocation()` for city/coordinates.

If a patch contains no recognized setting, the route returns `{ ok: true }`.

## Appearance Tab

`components/settings/AppearanceTab.tsx` handles:

- Theme.
- Language.
- Weather/location city.
- Timezone.
- Assistant/system notifications toggle.

### Theme

Theme UI is `components/theme/ThemeToggle.tsx`.

Save flow:

```text
user selects light/dark/system
  -> next-themes setTheme()
  -> PATCH /api/settings { theme }
  -> ThemeHydrator restores DB theme after browser wipe
```

The root app layout mounts `ThemeProvider`. The authenticated app layout passes `preferredTheme` into `ThemeHydrator`.

### Language

Language UI is `components/shared/LanguageToggle.tsx`.

Save flow:

```text
user selects de/en
  -> useLanguage() writes language cookie + localStorage
  -> document.documentElement.lang updates
  -> router.refresh()
  -> PATCH /api/settings { language }
  -> LanguageHydrator restores DB language after browser wipe
```

Server resolution lives in `i18n/request.ts`:

1. Use language cookie if valid.
2. If cookie missing and user is authenticated, try DB preference.
3. Fall back to `Accept-Language`.
4. Fall back to German (`de`).

Language constants live in `types/i18n.ts`.

### Location And Timezone

Location is a display city plus coordinates used by weather.

```text
AppearanceTab city search
  -> GET /api/weather/geocode?q=...
  -> select suggestion
  -> PATCH /api/settings { location, locationLat, locationLon }
  -> updateUserLocation()
  -> stored in User.preferences
```

Timezone is stored directly:

```text
select timezone
  -> PATCH /api/settings { timezone }
  -> updateUserTimezone()
  -> stored in User.timezone
```

Timezone must be one of `VALID_TIMEZONES`.

### Notifications Toggle

`notificationsEnabled` is stored in `User.preferences`.

It is a broad opt-out for generated assistant messages and proactive notifications. Greeting generation and nudge logic read this preference before doing work.

## Assistant Tab

`components/settings/AssistantTab.tsx` handles assistant behavior.

State and save logic live in:

```text
components/settings/logic/useAssistantSettings.ts
```

Saved fields:

```text
assistantName
assistantTone
addressStyle
responseLength
customSystemPrompt
autoBriefingEnabled
reportsEnabled
overdueTaskNudgesEnabled
```

Save behavior:

- Assistant name is debounced by 800 ms.
- Custom system prompt is debounced by 1000 ms.
- Tone, address style, response length, and toggles save immediately.
- Each save calls `PATCH /api/settings`.
- Success and failure toasts are localized.

The assistant settings affect `lib/context/build.ts`:

- `assistantName` changes the system prompt identity.
- `assistantTone` adds tone instructions.
- `addressStyle` adds addressing instructions.
- `responseLength` adds length instructions.
- `customSystemPrompt` is appended under `## User Instructions`.
- `language` controls the default assistant response language.
- `timezone` affects the current date shown to the assistant.

Automation fields:

- `autoBriefingEnabled` is read by briefing cron/manual logic.
- `reportsEnabled` controls whether chat tool activity creates reports.
- `overdueTaskNudgesEnabled` controls overdue task nudges, but the toggle is disabled when the user's tier does not allow nudges.

## Tools Tab

`components/settings/ToolsTab.tsx` lets users disable individual LLM tools.

Server page passes:

```text
allTools = TOOL_REGISTRY.map({ name, minTier, group })
initialDisabledTools = prefs.disabledTools
current tier
```

Save flow:

```text
toggle tool
  -> PATCH /api/settings { disabledTools: [...] }
  -> API filters names against TOOL_REGISTRY
  -> User.preferences.disabledTools
```

Locked tools are shown disabled when `tool.minTier` is above the user's tier. Enabled/disabled tools are applied by `getActiveToolsForUser(userId)` before chat sends tools to the LLM, and checked again in `executeToolCall()`.

## Usage Tab

`components/settings/UsageTab.tsx` is read-only except refresh.

Load/refresh flow:

```text
SettingsPage -> getUserUsage(userId)
Refresh button -> GET /api/settings/usage
```

`lib/settings/usage.logic.ts` builds a `UsageSummary` from:

- `User.tier`
- current record counts
- `UsageCounter`
- plan limits from `getPlanLimits(tier)`

When adding visible quotas, update `types/billing.ts`, `getUserUsage()`, `UsageTab`, and both locale files.

## Provider Tab

`components/settings/ProviderTab.tsx` shows LLM provider health.

Load/refresh flow:

```text
SettingsPage -> getProviderStatus()
Refresh button -> GET /api/settings/provider-status
```

This tab does not save user preferences. It reports current runtime provider state.

## Integrations Tab

`components/settings/IntegrationsTab.tsx` shows connected external services.

Settings page loads `Integration` rows for the user and passes them as initial state. The tab delegates provider-specific actions to integration routes such as:

```text
/api/integrations/google-calendar/connect
/api/integrations/google-calendar/disconnect
/api/integrations/google-calendar/sync
/api/integrations/google-drive/connect
/api/integrations/google-drive/disconnect
/api/integrations/google-drive/sync
```

Integration state is stored in the `Integration` table, not in `User.preferences`.

## Subscription Tab

`components/settings/SubscriptionTab.tsx` manages billing entrypoints.

Save/change flow:

```text
Free user subscribes
  -> POST /api/stripe/checkout
  -> Stripe Checkout
  -> onboarding success or webhook
  -> syncUserTierFromSubscription()
  -> User.tier updated

Paid user manages plan
  -> POST /api/stripe/portal
  -> Stripe Customer Portal
  -> webhook syncs tier changes
```

Subscription state is stored mostly in Stripe, with `User.tier` and `User.stripeCustomerId` mirrored locally.

## Adding A New User Setting

For a new setting:

1. Add it to `UserPreferences` in `lib/settings/user-preferences.logic.ts`.
2. Parse and validate it in `parseUserPreferences()`.
3. Merge and serialize it in `updateUserPreferences()`.
4. Accept and validate it in `app/api/settings/route.ts`.
5. Load it in `app/(app)/settings/page.tsx`.
6. Pass it through `SettingsShell` to the relevant tab.
7. Add UI state and a save call in the tab or a `logic/` hook.
8. Add localized strings to both message files.
9. Wire the saved preference into the consumer, such as `buildSystemPrompt()`, cron logic, notifications, or UI hydration.

If the value must be queried often outside preference JSON, consider whether it belongs as a real `User` column instead.

## Settings Checklist

Before finishing settings work, verify:

- Server page authenticates before loading user settings.
- New values are user-scoped.
- Preference JSON is parsed through `parseUserPreferences()`.
- API route validates and caps incoming values.
- Browser state, cookies, and DB preference stay in sync for language/theme.
- Timezone changes update `User.timezone`, not preferences JSON.
- User-facing labels, descriptions, toasts, placeholders, and aria labels are localized.
- Settings that affect LLM behavior are reflected in `lib/context/build.ts` or the relevant consumer.
- Tool settings use valid names from `TOOL_REGISTRY`.
- Usage, integration, and subscription state are not incorrectly stored in `User.preferences`.
