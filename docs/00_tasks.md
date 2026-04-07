# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---

## NEW NEW NEW

### Branch: `feat/memory`

- [ ] **#4 Memory tool** - no idea yet
    > **NOTE:** use some magic to reduce tokens by summarizing old messages in the conversation, or saving keywords from tasks and meetings etc , i dont know yet.
- [ ] **#5 Notes tool** — needs schema; lightweight freeform records, simpler than knowledge docs.
    > **NOTE:** this feature will be implemented in a future phase, Plan is to have MVP notes-app, similar to notes in Notion, with a simple text editor and the ability to link to tasks/meetings/contacts.
- [ ] **#6 User Profile Settings** — allow users to change name, username. Email/password changes need careful handling with Better Auth. `ProfileShell` is currently read-only.
- [ ] **#7 Dropdown menus (timezone + location)** — current design is poor; redesign with a searchable combobox. Do alongside #6 since both touch the same settings shell.
- [x] **#17 Add `react-markdown`** — render Markdown in chat messages, system prompt preview, and chat settings editor.
- [ ] **#18 `PersonalInfo` model** — schema exists, `app/api/knowledge/personal/` folder exists but is empty, no lib, no context slot, no UI. Implement fully and feed into the system prompt.
    > **NOTE:** I dont think this really important, users have their profiles, they can edit it, and llm's aware of it. update or delete info is restricted by the user, and llm can only read it. remove model!
- [ ] **#19 Meeting prep pack** — `Meeting.prepPack` was migrated but is 0% implemented (always returns `null`). Add the generate action, tool parameter, and UI to display the pack.
- [ ] **#22 Briefings tool** — `BriefingCache` model exists; daily LLM brief over tasks/meetings/decisions + Worker
- [ ] **#27 Extend LLM cross-linking awareness** — LLM can link a contact to a meeting, a note to a decision, etc. Depends on Decisions (#3) + Notes (#5) being live.
- [ ] **#28 Calendar tool (Google integration)** — `Integration` model exists with `google_calendar` type; depends on Meetings being fully live.
- [ ] **#29 Contact Card Share Link** — generate a 24h share link; user picks what info to expose. `ShareToken` model exists. Triggerable from profile page or via LLM tool call.
- [ ] **#30 Rich Document Support** — PDF, Word, Excel ingestion into knowledge base. `mammoth` and `pdf-parse` are already in `package.json` but never imported — wire them up here.
- [ ] **#31 Tools-usage Reports** — `AssistantReport` model exists; surface analytics on which tools are used.
- [ ] **#32 Remove dead production dependencies** — `mammoth` and `pdf-parse` are in `package.json` and `serverExternalPackages` but never imported. Remove until #30 is implemented.
- [ ] **#33 `emailVerified` always false** — Better Auth stores the field but no email verification plugin is configured and it is never checked as an access gate. Stub the plugin or document the intent before existing users become a migration problem.
- [ ] **#34 In-memory rate limiter not production-safe** — the implementation is self-documented as broken under multi-node/serverless deploys. Replace with a Redis-backed or edge-compatible store when deploying to production.
- [ ] **#35 Refactor Sidebar navigation** — use an array + `.map()` instead of hardcoded JSX for easier scaling. and add new routes.
- [ ] **#36 Add `index.ts` barrel exports** — add missing `index.ts` in components and lib folders for cleaner imports.
- [ ] **#37 Add `date-fns`** — standardize date formatting and timezone handling across the app.
- [ ] **#38 Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.
- [ ] **#39 Add `langfuse`** — LLM observability and prompt debugging. Useful pre-production, not during active development.
- [ ] **#40 4 seed users** — different tiers, pre-filled data for demos and testing.
- [ ] **#41 Testing infrastructure** — no `jest`/`vitest` config, no `.spec.ts` files anywhere. The tier enforcement, tool handlers, and schema validators have no safety net. Defer until the feature set stabilizes.

# DONE


## brainstorming — not yet scoped or planned

- mobile navbar, close automatic after redirect
- footer on small screen, adjust, better layout then 1 long column of links
- add new routes from navbar to sidebar
- add cmd+k shortcut to focus search input and add this feature .
- version bump rule => update to 0.2.0 and make it the automatic increment count until 0.2.9, then jump to 0.3.0 and repeat, this is to make it easier to track versions during development.
- When I am on Free tier, I have a maximum amount of tools calls per month, but what about creating manually from UI? something could be also related to `memory`.
- I dont see prices any where, `/plans`, it needs update anyway to reflect new tier system. the badge for "current plan" is overlapping card boarder.

