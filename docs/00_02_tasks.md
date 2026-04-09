# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---

## Beta — implement before first stable release

- [ ] **#31 Tools-usage Reports** — `AssistantReport` model exists; surface analytics on which tools are used.

---

## Deferred — not needed until production / multi-user

- [ ] **#34 In-memory rate limiter** — safe for single-node/dev. Replace with Upstash Rate Limit (Redis-backed) before multi-instance or serverless deploy.
- [ ] **#38 Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.

- [ ] **#40 4 seed users** — different tiers, pre-filled data for demos and testing, different language and theme preferences.
- [ ] **#41 Testing infrastructure** — no `jest`/`vitest` config anywhere. Defer until the feature set stabilizes.

## Brainstorming / Backlog

- [ ] **#42 Extend Notifications** — Currently only "User Greetings" on Login (once or twice per day ?? check!), and once on new sign-up. IMPORTANT: there is a toggle in settings for greetings notification to enable/disable.
- [ ] **#43 One-time data wipe** — premium/enterprise users can request a full wipe of `Chunk` + `MemoryEntry` data once every 6 months. Does not reset monthly usage limits.
- [ ] **#76 ALL LLM CALLS** — ENSURE ALL LLM CALLES TOKENS GET ALSO CALCUATED AND ADDED TO APPROXIMATE TOKEN COUNT FOR MONTHLY LIMIT ENFORCEMENT. CURRENTLY SOME CALLS MIGHT BE MISSING THIS, ESPECIALLY IN TOOLS. NEED TO AUDIT ALL LLM CALLS AND MAKE SURE THIS IS CONSISTENTLY APPLIED. EVEN WHEN LLM SAYS "Done" after calling a tool, must be counted towards monthly token limit. This is critical to prevent abuse and ensure fair usage across users.
Every letter everything the llm input/out must be calculated, either in one counter for both, or separate counters.
- [ ] **#77 System Prompt** — The ssystem must have 2 distguished prompts:
    - Default System Prompt: non-editable, contains core instructions for the assistant's behavior and capabilities. This is the "base" system prompt that ensures consistent performance and adherence to guidelines.
    - Custom System Prompt: editable by the user, allows them to add specific instructions, preferences, which we already have in ASsistant tab in settings. Just need to seperate and re-structure.
