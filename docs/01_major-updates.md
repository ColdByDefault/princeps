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

- Build first feature **Tasks** according to new architecture (see `lib/` structure in instructions). This will be a simple CRUD feature with some slots for the LLM context.






# to do:
  - [ ] Improve Sidebar-Footer
  - [ ] Empty Chats cant be renamed, deleted
  - [ ] Add rules for Username (no spaces, unique, etc.) and enforce in Auth routes
  - [ ] Add `index.ts` files where missing for better import paths and encapsulation.
  - [ ] Adjust the imports in `providers.ts`
  - [ ] What happen if i keep creating new chats and delete them? What if i do so, and then kept only 5 Chats saved but no monthly tokens left? check all these scenarios and make sure the UX is good and the user is properly informed about limits, etc.
  - [ ] Add Markdown support for system prompts in chat settings.
  - [ ] Add missing navigations to sidebar.
  - [ ] Add refresh buttons to settings pages to reflect changes immediately without needing a full page refresh.
  - [ ] Add UI errors when try to navigate to protected routes (e.g. chat) while not authenticated, or when hitting rate limits, etc.
  - [ ] Tasks Filter exist but the task missing the category field, so the filter does not work, add category to task and wire it up to filter.
# plan
- [ ] Refactor Chat-Widget to use new architecture and patterns (chat steam, tools, awareness of LLM provider, etc.)
- [ ] Add Notifications System
- [ ] Introduce Labels System => Global Labels created from app-settings can be used to label chats, tasks, etc. These labels can have a name, color, and LLM can use them as well as creating new ones.
- [ ] Add dynamic loading.tsx messages, or generalize it a bit. (currently it shows "Preparing Workspace..." on every loading state, but it could be more dynamic, e.g. "Loading chats...", etc.), use `components\shared\LoadingRing.tsx`
