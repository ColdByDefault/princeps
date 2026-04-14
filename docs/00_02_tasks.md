# Tasks

Tasks are grouped by branch. One branch = one PR. Small related fixes share a single branch.

---

## Ready for Implementation

- [ ] **#44 Gmail** — read/write access to draft replies, flag urgent messages, summarize long threads, and automatically extract tasks or meetings from your inbox. google API key exists already and used for calendar integration.
- [ ] **#45 Google Drive** — The ability to index documents. If user asks a question or has a meeting, it can pull context not just from its own Memory/KB, but from your spreadsheets, PDFs, and slide decks.
- [ ] **#46 Smart Scheduling & Conflict Resolution** — Instead of just reading/writing the calendar, give the agent logic to protect user's time. If a meeting runs long, it proactively suggests moving the next one.
- [ ] **#47 Location** — Allow user to search for their city. no pre-defined list of cities, but can search for any city in the world. This is used for weather. 
- [ ] **#48 ** —
- [ ] **#49 ** —
- [ ] **#50 ** —
- [ ] **#51 ** —
- [ ] **#52 ** —

## Backlog

- [ ] **Extend Notifications** — but first check/improve greetings. Currently only "User Greetings" on Login (once or twice per day ?? check!), and once on new sign-up. IMPORTANT: there is a toggle in settings for greetings notification to enable/disable.
- [ ] **One-time data wipe** — premium/enterprise users can request a full wipe of `Chunk` + `MemoryEntry` data once every 6 months. Does not reset monthly usage limits.
  > Needs and admin and a request from user to admin.
- [ ] **Refactor README**.
- [ ] **Admin Dashboard** — user management, content moderation, system health, usage analytics. No value without real users.
- [ ] **Testing infrastructure** — no `jest`/`vitest` config anywhere. Defer until the feature set stabilizes.
- [ ] **Extend Knowledge Base** — currently supports `.txt` and `.md` files. Extend to support more file types (e.g. PDF, Word, Excel, email formats)
- [ ] **Almight-Script** — a Linux/Powershell/Bash script to set up a local development environment with one command: install dependencies, create .env file and copy content from .env.example to it, start docker, generate/migrate data, seed test data, and start dev server. Instead of having to run multiple commands, developers can just run this script and be ready to go.
- [ ] **Verification** — Show Email verification badge on user profile (in `/profile` page), no verfication plug-in yet, because i dont have SMTP set up, but can be done manually by setting `isVerified` to true in the database for now. This is a placeholder until we implement a proper email verification flow.
- [ ] **Improve Calendar Drawer** — Meetings creation has no integrations connected, this could be Meetings Create Form.check everything again.
- [ ] \*\* \*\* —
- [ ] \*\* \*\* —
- [ ] \*\* \*\* —
- [ ] \*\* \*\* —
- [ ] \*\* \*\* —
- [ ] \*\* \*\* —
- [ ] \*\* \*\* —
