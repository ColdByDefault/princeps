## UI

- [ ] Model selector dropdown in Assistant Settings — choose provider (Ollama/Groq) and model at runtime without server restart (ties into feat/core-8-llm-providers)
- [ ] Global search overlay (⌘K) — query contacts, meetings, tasks, decisions, and knowledge chunks in a single shot
- [x] Show tier-aware quota badges in chat sidebar and knowledge page (history limit, daily count, doc count)
- [ ] Billing/upgrade surface — even a minimal "Current plan: Free · Upgrade" banner so tiers are visible to users

## UX

- [ ] Social login — GitHub OAuth and Google OAuth for low-friction onboarding (already listed under Providers)
- [ ] In-app error feedback when a Google token is revoked (invalid_grant) — currently the Integration row silently breaks
- [ ] Rate-limit / tier-limit errors should surface a user-friendly toast with the specific limit hit, not a generic 429
- [ ] OAuth callback result toast — show green/red toast after Google OAuth connect flow; settings page currently shows no feedback after the redirect (see docs/12_phase-8-hardening.md B1)
- [ ] IntegrationsTab loading skeleton — show pulse skeleton while integration status loads on first render; tab currently flashes empty (see docs/12_phase-8-hardening.md B2)
- [ ] Sync count toast — show event counts ("12 synced, 3 skipped") in the post-sync success toast instead of a generic message (see docs/12_phase-8-hardening.md B3)
- [ ] Disconnect confirmation dialog — wrap Google Calendar disconnect in an AlertDialog before executing DELETE (see docs/12_phase-8-hardening.md B4)

## Functionality

- [ ] AI update & delete tool calls — extend chat tool registry so the assistant can rename, update, and delete contacts / meetings / tasks / decisions by conversation (currently create-only)
- [ ] Google Calendar write-back — push meeting creates/reschedules from See-Sweet back to Google Calendar (currently read-only)
- [ ] Decrement knowledgeUploadsUsed on document delete — otherwise free-tier quota shrinks permanently even after deletions (see docs/15_tier-enforcement.md P4)
- [ ] Recurring meetings — meeting series support (weekly 1:1s, quarterly reviews) backed by existing calendar sync
- [ ] Data export — export briefing packs, meeting prep, or decision logs as PDF for sharing outside See-Sweet
- [ ] Timezone-aware weekly cron — use user.timezone to determine local Friday/week-start for briefing and digest jobs instead of UTC (see docs/12_phase-8-hardening.md C1)
- [ ] Meeting follow-up end-time — compute effective end as scheduledAt + durationMin before filtering; currently uses start time as proxy so long meetings trigger follow-up too early (see docs/12_phase-8-hardening.md C2)
- [ ] Zod schemas for settings and admin routes — lib/settings/schemas.ts and lib/admin/schemas.ts; safeParse in PATCH /api/settings and PATCH /api/admin/users/[id] (see docs/12_phase-8-hardening.md E2)

## Features

- [ ] AI PDF & DOCX knowledge upload — libraries (pdf-parse, mammoth) are installed but only .txt/.md are wired into the ingest pipeline
- [ ] Meeting transcription / audio upload — upload a recording, get summary + action items written to the meeting record
- [ ] Email notification delivery — daily digest email as fallback to in-app inbox (cron already generates the content)
- [ ] Team / shared workspace mode — lightweight multi-user workspace layer to open a B2B angle (roadmap mentions up to 50 employees)
- [ ] Briefing and meeting-prep tier gating — enforce per-tier daily caps instead of flat rate limiter for all users (see docs/15_tier-enforcement.md P1/P2)
- [ ] Cron briefing job tier gating — skip LLM calls for free-tier users whose preference is not explicitly opted in (see docs/15_tier-enforcement.md P3)

## Integrations

- [ ] Google Calendar write-back (see Functionality above)
- [ ] Email delivery provider (SendGrid / Resend) for notification emails

## Providers

- LLM
  - [ ] Groq API — model selector UI (runtime switch, not env-var only)
  - [ ] Ollama — confirm local model list endpoint and surface in UI
- Auth
  - [ ] Github OAuth
  - [ ] Google OAuth

## Other

- [ ] Share token tier gating — restrict share links to pro/premium or cap active tokens per free user (see docs/15_tier-enforcement.md P5)
- [ ] Google Calendar integration tier gating — restrict connect and cron sync to pro/premium, or define what free tier gets (see docs/15_tier-enforcement.md P6)
- [ ] Reports storage cap — rolling window or tier-based total limit on auto-generated reports; currently accumulate indefinitely (see docs/15_tier-enforcement.md P7)
- [ ] Chat stream daily LLM budget — tier-based daily limit on LLM turns within an open chat; currently only burst-rate limited (see docs/15_tier-enforcement.md P8)
- [ ] AI tool call daily budget — count tool executions per day for free tier; one chat triggering many creates currently bypasses the daily chat limit (see docs/15_tier-enforcement.md P4)
- [ ] Env var guard in Google routes — return 503 with a clear message if GOOGLE_CLIENT_ID / SECRET / REDIRECT_URI are missing at connect or sync time (see docs/12_phase-8-hardening.md D1)
- [ ] CRON_SECRET dev warning — log explicit console.warn when CRON_SECRET is unset and any cron route is hit (see docs/12_phase-8-hardening.md D2)
- [ ] Per-user timezone for dedup windows — alreadyFiredToday / alreadyFiredThisWeek currently use UTC; should respect user.timezone (see docs/12_phase-8-hardening.md, later)
- [ ] Rate-limit manual Google sync button — prevent rapid repeated sync calls from the settings UI (see docs/12_phase-8-hardening.md, later)
- [ ] Integration health display — surface last error and last successful sync time on the integrations settings card (see docs/12_phase-8-hardening.md, later)
