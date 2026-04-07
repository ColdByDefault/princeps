# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---

### Branch: `feat/notes`

> **NOTE:** this feature will be implemented in a future phase, Plan is to have MVP notes-app, similar to notes in Notion, with a simple text editor and the ability to link to tasks/meetings/contacts.

- [ ] **#5 Notes tool** — needs schema; lightweight freeform records, simpler than knowledge docs.

### Branch: `feat/profile-settings`

- [ ] **#6 User Profile Settings** — allow users to change name, username. Email/password changes need careful handling with Better Auth. `ProfileShell` is currently read-only.
- [ ] **#7 Dropdown menus (timezone + location)** — current design is poor; redesign with a searchable combobox. Do alongside #6 since both touch the same settings shell.

### Branch: `fix/llm-tools`

- [ ] **#10 Increase Task Notes character limit** — 250 chars is too short; increase it.

---

## Important — Polish & Correctness

### Branch: `fix/ui-polish`

- [ ] **#11 Contacts empty state** — tasks and meetings look fine when empty; contacts looks bad. makes also list to match. with refresh btn of course
- [ ] **#12 Duplicate "+ New Task" button** — tasks page shows two buttons when the list is empty. Remove the redundant one.
- [ ] **#14 TasksList UI** — general layout and visual improvements needed.
- [ ] **#15 Label overflow** — when tasks/meetings have many labels, show first 2-3 then "+X more", matching the contacts pattern.
- [ ] **#16 `/chat` double loading screen** — investigate why two skeleton/loading states appear on initial navigation.

### Branch: `feat/markdown`

- [ ] **#17 Add `react-markdown`** — render Markdown in chat messages, system prompt preview, and chat settings editor.

---

## Enhancements — Next Feature Wave

### Branch: `feat/personal-info`

> **NOTE:** I dont think this really important, users have their profiles, they can edit it, and llm's aware of it. update or delete info is restricted by the user, and llm can only read it. remove model!

- [ ] **#18 `PersonalInfo` model** — schema exists, `app/api/knowledge/personal/` folder exists but is empty, no lib, no context slot, no UI. Implement fully and feed into the system prompt.

### Branch: `feat/meeting-prep-pack`

- [ ] **#19 Meeting prep pack** — `Meeting.prepPack` was migrated but is 0% implemented (always returns `null`). Add the generate action, tool parameter, and UI to display the pack.

### Branch: `feat/briefings`

- [ ] **#22 Briefings tool** — `BriefingCache` model exists; daily LLM brief over tasks/meetings/decisions.

### Branch: `feat/goals`

- [ ] **#23 Goals tool** — needs schema design (structure, milestones, link to tasks).

### Branch: `feat/llm-crosslink`

- [ ] **#27 Extend LLM cross-linking awareness** — LLM can link a contact to a meeting, a note to a decision, etc. Depends on Decisions (#3) + Notes (#5) being live.

---

## Nice to Have — Can Be Delayed

### Branch: `feat/calendar`

- [ ] **#28 Calendar tool (Google integration)** — `Integration` model exists with `google_calendar` type; depends on Meetings being fully live.

### Branch: `feat/contact-share`

- [ ] **#29 Contact Card Share Link** — generate a 24h share link; user picks what info to expose. `ShareToken` model exists. Triggerable from profile page or via LLM tool call.

### Branch: `feat/knowledge-rich-docs`

- [ ] **#30 Rich Document Support** — PDF, Word, Excel ingestion into knowledge base. `mammoth` and `pdf-parse` are already in `package.json` but never imported — wire them up here.

### Branch: `feat/tools-reports`

- [ ] **#31 Tools-usage Reports** — `AssistantReport` model exists; surface analytics on which tools are used.

### Branch: `chore/cleanup`

- [ ] **#32 Remove dead production dependencies** — `mammoth` and `pdf-parse` are in `package.json` and `serverExternalPackages` but never imported. Remove until #30 is implemented.
- [ ] **#33 `emailVerified` always false** — Better Auth stores the field but no email verification plugin is configured and it is never checked as an access gate. Stub the plugin or document the intent before existing users become a migration problem.
- [ ] **#34 In-memory rate limiter not production-safe** — the implementation is self-documented as broken under multi-node/serverless deploys. Replace with a Redis-backed or edge-compatible store when deploying to production.
- [ ] **#35 Refactor Sidebar navigation** — use an array + `.map()` instead of hardcoded JSX for easier scaling.
- [ ] **#36 Add `index.ts` barrel exports** — add missing `index.ts` in components and lib folders for cleaner imports.
- [ ] **#37 Add `date-fns`** — standardize date formatting and timezone handling across the app.

---

## Deferred — Needs User Base First

- [ ] **#38 Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.
- [ ] **#39 Add `langfuse`** — LLM observability and prompt debugging. Useful pre-production, not during active development.
- [ ] **#40 4 seed users** — different tiers, pre-filled data for demos and testing.
- [ ] **#41 Testing infrastructure** — no `jest`/`vitest` config, no `.spec.ts` files anywhere. The tier enforcement, tool handlers, and schema validators have no safety net. Defer until the feature set stabilizes.

# DONE

- [x] **#1 Wire dead rate limiters** — `writeRateLimiter`, `searchRateLimiter`, `briefingRateLimiter`, and `prepRateLimiter` are all defined in `lib/security.ts` but never imported or applied anywhere. Every mutation route (`POST/PATCH/DELETE` on tasks, meetings, contacts, labels) is completely unprotected. Apply them.
- [x] **#2 Password reset flow** — no `forgetPassword` / `resetPassword` pages or API hooks exist. Users who lose their password permanently lose access. Better Auth has the plugin; wire it up.
- [x] **#2.1 Extra**: add pgvector db health check and run when `npm run dev` starts.
- [x] **#3 Decisions tool** — schema complete, linked to meetings. Wire up handler, API, and UI.
- [x] **#4 Stub `decisions` i18n namespace** — `messages/de.json` and `messages/en.json` only have the nav label. Add a top-level `"decisions": {}` stub now to avoid a runtime i18n crash the moment any component does `useTranslations("decisions")`.
- [x] **#8 LLM tool reply verbosity** — when the LLM calls a tool and it succeeds, in chat-widget keep the insider toast but reduce the LLM reply text to "Done" only.
- [x] **#9 Add `delete_task` to LLM tool registry** — `DELETE /api/tasks/[id]` and `deleteTask` logic both work, but there is no tool schema or handler entry. The LLM can never delete a task via chat. but the llm needs to ask user for confirmation as for contacts, or meeting. decision doesn thave delete tool at all
- [x] **#20 Tier limits on meetings + tasks + decisions** — contacts and knowledge are gated per plan; meetings, decisions, and tasks are not. Inconsistent with the tier model. Add per-plan limits.
- [x] **#21 Remove dead `enforceKnowledgeDocs` export** — deprecated function is still re-exported from `lib/tiers/index.ts` but never called. Remove it.
- [x] **#25 Tool availability per tier + user toggle** — change which tools are available by tier; allow users to enable/disable tools manually in settings.
- [x] **#26 Make "Available Tools" in settings dynamic** — derive list from `TOOL_REGISTRY`, not a hardcoded array. Do alongside #25.
- [x] **#24 Add 20 Lucide icons to labels system** — allow icon selection per label; update label display wherever labels are rendered.
- [x] **Extra**: move Labels to Intelligence group in navbar, and create dedicted page.tsx
- [x] **#13 Chat-Widget status dot** — switch from gray to green (online indicator).


mobile navbar, close automatic after redirect
footer on small screen, adjust
add new routes from navbar to sidebar
add cmd+k shortcut to focus search input and add this feature .