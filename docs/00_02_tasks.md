# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---

## Beta — implement before first stable release

- [ ] **#22 Briefings tool** — `BriefingCache` model exists; daily LLM brief over tasks/meetings/decisions + Worker.
- [ ] **#31 Tools-usage Reports** — `AssistantReport` model exists; surface analytics on which tools are used.

---

## Deferred — not needed until production / multi-user

- [ ] **#34 In-memory rate limiter** — safe for single-node/dev. Replace with Upstash Rate Limit (Redis-backed) before multi-instance or serverless deploy.
- [ ] **#38 Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.
- [x] **#39 Add `langfuse`** — LLM observability and prompt debugging. Wire up pre-production, not during active development.
- [ ] **#40 4 seed users** — different tiers, pre-filled data for demos and testing, different language and theme preferences.
- [ ] **#41 Testing infrastructure** — no `jest`/`vitest` config anywhere. Defer until the feature set stabilizes.

## Brainstorming / Backlog

- [ ] **#42 Extend Notifications** — Currently only "User Greetings" on Login (once or twice per day ?? check!), and once on new sign-up. IMPORTANT: there is a toggle in settings for greetings notification to enable/disable.
- [ ] **#43 One-time data wipe** — premium/enterprise users can request a full wipe of `Chunk` + `MemoryEntry` data once every 6 months. Does not reset monthly usage limits.
- [ ] **#74 `lib/tools/registry.ts` refactor** — The file is too big.
- [ ] **#76 ALL LLM CALLS** — ENSURE ALL LLM CALLES TOKENS GET ALSO CALCUATED AND ADDED TO APPROXIMATE TOKEN COUNT FOR MONTHLY LIMIT ENFORCEMENT. CURRENTLY SOME CALLS MIGHT BE MISSING THIS, ESPECIALLY IN TOOLS. NEED TO AUDIT ALL LLM CALLS AND MAKE SURE THIS IS CONSISTENTLY APPLIED. EVEN WHEN LLM SAYS "Done" after calling a tool, must be counted towards monthly token limit. This is critical to prevent abuse and ensure fair usage across users.
