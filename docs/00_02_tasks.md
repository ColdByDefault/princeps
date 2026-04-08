# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---

## Beta — implement before first stable release

- [ ] **#2 `cmd+k` search shortcut** — focus search input on `cmd+k` / `ctrl+k`; wire up the shortcut across the app.

- [ ] **#19 Meeting prep pack** — `Meeting.prepPack` was migrated but is 0% implemented (always returns `null`). Add the generate action, tool parameter, and UI to display the pack.
- [ ] **#22 Briefings tool** — `BriefingCache` model exists; daily LLM brief over tasks/meetings/decisions + Worker.

- [ ] **#29 Contact Card Share Link** — generate a 24h share link; user picks what info to expose. `ShareToken` model exists. Triggerable from profile page or via LLM tool call.
- [ ] **#31 Tools-usage Reports** — `AssistantReport` model exists; surface analytics on which tools are used.

---

## Deferred — not needed until production / multi-user

- [ ] **#34 In-memory rate limiter** — safe for single-node/dev. Replace with Upstash Rate Limit (Redis-backed) before multi-instance or serverless deploy.
- [ ] **#38 Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.
- [ ] **#39 Add `langfuse`** — LLM observability and prompt debugging. Wire up pre-production, not during active development.
- [ ] **#40 4 seed users** — different tiers, pre-filled data for demos and testing.
- [ ] **#41 Testing infrastructure** — no `jest`/`vitest` config anywhere. Defer until the feature set stabilizes.

## Brainstorming / Backlog

- [ ] **#42 Extend Notifications** — Currently only "User Greetings" on Login (once or twice per day ?? check!), and once on new sign-up. IMPORTANT: there is a toggle in settings for greetings notification to enable/disable.
- [ ] **#43 One-time data wipe** — premium/enterprise users can request a full wipe of `Chunk` + `MemoryEntry` data once every 6 months. Does not reset monthly usage limits.
- [ ] **#44 ** —
- [ ] **#45 ** —
- [ ] **#46 ** —
- [ ] **#47 ** —
- [ ] **#48 ** —
