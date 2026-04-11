# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---


## Deferred — not needed until production / multi-user

- [ ] **#34 In-memory rate limiter** — safe for single-node/dev. Replace with Upstash Rate Limit (Redis-backed) before multi-instance or serverless deploy.
- [ ] **#38 Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.

- [ ] **#40 4 seed users** — different tiers, pre-filled data for demos and testing, different language and theme preferences.
- [ ] **#41 Testing infrastructure** — no `jest`/`vitest` config anywhere. Defer until the feature set stabilizes.

## Brainstorming / Backlog

- [ ] **#42 Extend Notifications** — Currently only "User Greetings" on Login (once or twice per day ?? check!), and once on new sign-up. IMPORTANT: there is a toggle in settings for greetings notification to enable/disable.
- [ ] **#43 One-time data wipe** — premium/enterprise users can request a full wipe of `Chunk` + `MemoryEntry` data once every 6 months. Does not reset monthly usage limits.
  > Needs and admin and a request from user to admin.

