# Major Updates 1

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

- Language and i18nternationalization (i18n).
- Replaced the custom `getMessage()` / flat `MessageDictionary` system with `next-intl`. Cookie-based locale detection is seeded in middleware (`proxy.ts`), resolved in `i18n/request.ts`, and provided app-wide via `NextIntlClientProvider` in the root layout. Message files (`messages/de.json`, `messages/en.json`) now use nested keys by namespace (e.g. `common`, `auth`, `nav`, `errors`).
- Decoupled i18n from DB user preferences (`lib/settings/`) — locale resolution is now cookie → Accept-Language → `"de"` default. DB-backed preference sync will be re-wired when the settings feature is rebuilt.
- Applied new i18n settings to global UI (error, auth, nav)
- Refactored `Navbar.tsx` to split desktop and mobile into separate components.
- Refactored Auth routes and components to use ZOD validations, wire rate limiting, and improve UX for MVP (Password confirmation)
- Refactored `lib/tiers/enforce.ts` to return structured `{ allowed: boolean, reason?: string }` instead of throwing responses directly. This allows for more flexible handling of enforcement in different contexts (e.g. API routes vs. UI components) and better separation of concerns. Updated all calls to `enforceLimits()` accordingly.

# Major Updates 3

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