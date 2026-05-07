# 09 - App Settings

Last updated: 2026-05-07

Read this for a quick map of `/settings`. For the deeper user/preference storage model, see `08_USERS_REF.md`.

## Purpose

`/settings` is the authenticated user's control center for app behavior:

- Appearance: theme, language, location, timezone, notifications.
- Assistant: name, tone, address style, response length, custom prompt, automation toggles.
- Tools: enable/disable LLM tools available to the user's tier.
- Usage: read-only quota and plan usage overview.
- Provider: read-only LLM provider health.
- Integrations: connect/sync/disconnect external services.
- Subscription: Stripe checkout and customer portal entrypoints.

These are user settings, not global admin settings.

## Main Files

```text
app/(app)/settings/page.tsx        Server page: auth + initial data
components/settings/SettingsShell.tsx
components/settings/AppearanceTab.tsx
components/settings/AssistantTab.tsx
components/settings/ToolsTab.tsx
components/settings/UsageTab.tsx
components/settings/ProviderTab.tsx
components/settings/IntegrationsTab.tsx
components/settings/SubscriptionTab.tsx
components/settings/logic/useAssistantSettings.ts
app/api/settings/route.ts         PATCH saves most preferences
app/api/settings/usage/route.ts   Usage refresh
app/api/settings/provider-status/route.ts
lib/settings/user-preferences.logic.ts
lib/settings/usage.logic.ts
lib/settings/provider-status.logic.ts
```

## Page Load

`app/(app)/settings/page.tsx`:

1. Authenticates the user.
2. Loads provider status, usage summary, user preferences, timezone/tier, integrations, and tool registry summary.
3. Reads `settings-tab` cookie to restore the last active tab.
4. Passes everything into `SettingsShell`.

`SettingsShell` owns only active-tab state and persists tab selection back to `settings-tab`.

## Save Pattern

Most editable settings save through:

```text
PATCH /api/settings
```

The API validates known fields and writes either:

- `User.preferences` JSON for most preferences.
- `User.timezone` for timezone.

Settings tabs should call `/api/settings` directly or through a small `components/settings/logic/` hook. Show localized success/error feedback for user-visible saves.

## Tab Ownership

- `AppearanceTab`: theme, language, location, timezone, `notificationsEnabled`.
- `AssistantTab`: assistant behavior and automation toggles. Uses `useAssistantSettings`.
- `ToolsTab`: saves `disabledTools`; API filters names against `TOOL_REGISTRY`.
- `UsageTab`: read-only; refreshes from `/api/settings/usage`.
- `ProviderTab`: read-only; refreshes from `/api/settings/provider-status`.
- `IntegrationsTab`: uses provider-specific `/api/integrations/...` routes, not `/api/settings`.
- `SubscriptionTab`: uses Stripe checkout/portal routes, not `/api/settings`.

## Important Flows

Language:

```text
LanguageToggle
  -> cookie + localStorage + router.refresh()
  -> PATCH /api/settings { language }
  -> LanguageHydrator restores DB preference after browser wipe
```

Theme:

```text
ThemeToggle
  -> next-themes setTheme()
  -> PATCH /api/settings { theme }
  -> ThemeHydrator restores DB preference after browser wipe
```

Assistant behavior:

```text
AssistantTab
  -> useAssistantSettings
  -> PATCH /api/settings
  -> lib/context/build.ts consumes saved preferences
```

Tools:

```text
ToolsTab
  -> PATCH /api/settings { disabledTools }
  -> getActiveToolsForUser filters LLM tools
  -> executor rejects disabled/unavailable tools again
```

## Add Or Change A Setting

Checklist:

- Add/parse/save preference in `lib/settings/user-preferences.logic.ts`.
- Accept and validate it in `app/api/settings/route.ts`.
- Load it in `app/(app)/settings/page.tsx`.
- Pass it through `SettingsShell` to the owning tab.
- Add or update tab UI and save feedback.
- Add strings to both `messages/de.json` and `messages/en.json`.
- Wire the setting into the consumer: context builder, notifications, cron, theme/language hydration, tools, etc.

Keep usage, integrations, and subscription state out of `User.preferences` unless it is truly a user preference.
