# Major Updates 1

---

- /.github
  - Refactored global instructions => /.github/copilot-instructions.md
  - Refactored all 3 instructions => /.github/instructions/\*.instructions.md
  - **New** Agents:
    - Feature (full access, architecture enforcement)
    - Reviewer (read-only, architecture compliance)
    - Explore (read-only, research/explanation)
  - **New** Hooks:
    - guard-shadcn.ts (block edits to Shadcn components and enforce npx shadcn add for new components, unless explicitly bypassed in prompt)
  - Fixed node.js.yml.

- Refactored /prisma/schema.prisma to remove unused models and fields, and to better reflect the current database schema.
- Removed all APIs and related code (controllers, services, routes, etc.) for all features except Auth, Settings, and i18n. These will be re-built with the new architecture as needed.

# Major Updates 2

---

- Language and i18nternationalization (i18n).
- Replaced the custom `getMessage()` / flat `MessageDictionary` system with `next-intl`. Cookie-based locale detection is seeded in middleware (`proxy.ts`), resolved in `i18n/request.ts`, and provided app-wide via `NextIntlClientProvider` in the root layout. Message files (`messages/de.json`, `messages/en.json`) now use nested keys by namespace (e.g. `common`, `auth`, `nav`, `errors`).
- Decoupled i18n from DB user preferences (`lib/settings/`) — locale resolution is now cookie → Accept-Language → `"de"` default. DB-backed preference sync will be re-wired when the settings feature is rebuilt.
- Applied new i18n settings to global UI (error, auth, nav)
- Refactored `Navbar.tsx` to split desktop and mobile into separate components.
- Refactored Auth routes and components to use ZOD validations, wire rate limiting, and improve UX for MVP (Password confirmation)
- Refactored `lib/tiers/enforce.ts` to return structured `{ allowed: boolean, reason?: string }` instead of throwing responses directly. This allows for more flexible handling of enforcement in different contexts (e.g. API routes vs. UI components) and better separation of concerns. Updated all calls to `enforceLimits()` accordingly.

# Major Updates 3

---

- LLM providers:
  - `lib/llm-providers/ollama/*`
    - `ollama.ts`
    - `ollama-settings.ts`
    - `ollama-embedding.ts`
  - `lib/llm-providers/openai/*`
    - `openai.ts`
    - `openai-settings.ts`
    - `openai-embedding.ts`
  - `lib/llm-providers/shared/*`
    - `provider-health.ts`
    - `provider-test.ts`
  - `lib/llm-providers/provider.ts` (active provider dispatcher)
  - `types/llm.ts`
- Refactored App-Settings

# Major Updates 4

---

- Refactored /Chat and chat-settings dialog.
- Added Groq provider (API-based, similar to OpenAI), models filter in UI is intentionally hardcoded, Groq API doesn't query available models from API, it sends all models back.
- Added Simple `lib/context/build.ts`
- Redesigned Tier-System see => `docs/02_tier-system.md`
- **New** tier-tracking UI in Settings → Usage Tab, showing live counters for chats/day, messages/month, tokens/month, with progress bars relative to plan limits.

# Major Updates 5

---

- Build first feature **Tasks** according to new architecture (see `lib/` structure in instructions). This will be a simple CRUD feature with slots for the LLM context.
  > Important: LLM can mark Tasks as "Done" but cant delete them.

# Major Updates 6

---

- Refactored Labels System, included in settings, features, and LLM-awareness.

# Major Updates 7

---

- **Notifications & Weather System** — living presence layer (see `docs/08_notification-design.md`).
- `lib/weather/timezone-coords.ts` — static IANA timezone → lat/lon map (~130 timezones). GDPR-safe: no user IP sent externally.
- `lib/weather/fetch.ts` — Open-Meteo integration (no API key). Returns `WeatherSnapshot` (temp, WMO condition label + emoji, location).
- `lib/notifications/` — full server logic layer:
  - `shared.logic.ts` — `toNotificationRecord()`, `findTodayGreeting()`, `todayUtc()`
  - `list.logic.ts` — list non-dismissed, newest first, max 50
  - `mark-read.logic.ts` — mark one / mark all read
  - `delete.logic.ts` — soft-delete one / bulk clear
  - `greeting.logic.ts` — LLM-generated daily greeting with once-per-day dedup; `FORCE_GREETING=true` dev bypass
- `app/api/notifications/` — REST routes (GET, DELETE bulk, PATCH/DELETE by id, POST greeting)
- `hooks/use-notifications.ts` — state, optimistic updates, session-scoped greeting trigger
- `components/notifications/` — `NotificationBell` (bell icon + unread badge), `NotificationDrawer` (Shadcn Sheet, right side), `NotificationItem` (relative timestamp, unread indicator, per-item delete)
- Bell wired into `Navbar-Desktop` and `Navbar-Mobile`
- `components/home/HomeShell.tsx` — weather widget (emoji + °C + condition + location) + today's LLM greeting
- `app/(app)/home/page.tsx` — server-side weather fetch, passed to `HomeShell`
- i18n strings added to `messages/de.json` and `messages/en.json` (`notifications.*`, `home.weather.*`)
