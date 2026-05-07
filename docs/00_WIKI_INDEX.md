# Princeps Wiki Index

Last updated: 2026-05-07

This folder is the human wiki for Princeps. It is for developers, maintainers, testers, and people who want to understand or use the app without reading every source file.

For agent-specific implementation memory, use `CONTEXT/`. For the true final answer on behavior, always verify the current code.

## The Five Docs

```text
docs/00_WIKI_INDEX.md          Start here
docs/01_USER_GUIDE.md          How to use Princeps
docs/02_ARCHITECTURE.md        How the app is built
docs/03_FEATURES_REFERENCE.md  What each feature does and where it lives
docs/04_DEVELOPER_PLAYBOOK.md  How to change, extend, test, and operate it
```

## What Princeps Is

Princeps is a private executive secretariat and chief-of-staff workspace for one authenticated user at a time.

It combines:

- AI chat grounded in the user's workspace.
- Tasks, meetings, contacts, decisions, goals, labels, memory, reports, and briefings.
- Knowledge retrieval from uploaded or imported documents.
- Notifications, greetings, and proactive nudges.
- Settings, tiers, usage limits, billing, and external integrations.

It is not a generic chatbot, team collaboration system, or social-login product. External services connect as data integrations after the user signs in.

## Source Order

When information conflicts, trust sources in this order:

1. Current code, `package.json`, `prisma/schema.prisma`, and migrations.
2. `AGENTS.md` and `.github/` instructions.
3. `CONTEXT/` implementation notes.
4. These `docs/` wiki files.
5. `README.md`.

Keep this wiki short and readable. Deep implementation maps belong in `CONTEXT/`.

## Quick Paths

For users:

- Start with `01_USER_GUIDE.md`.
- Open `/settings` for language, theme, assistant behavior, integrations, usage, and subscription.
- Open `/knowledge` before asking the assistant about private documents.

For developers:

- Start with `02_ARCHITECTURE.md`.
- Use `03_FEATURES_REFERENCE.md` to find the owning files.
- Use `04_DEVELOPER_PLAYBOOK.md` before adding a feature, tool, integration, setting, or paid action.

## Useful Commands

```bash
npm install
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Current Integrations

Live:

- Google Calendar: syncs events into Meetings and can push meetings back to Google Calendar.
- Google Drive: lists supported files and imports selected files into Knowledge.

Planned provider families include Gmail, Microsoft Graph, Slack, GitHub, Jira, Notion, SharePoint, and Confluence.

## Production Notes

- Password reset links are logged in development unless a real email provider is wired.
- Rate limiting uses Upstash Redis when configured, otherwise an in-memory fallback.
- Langfuse tracing is production-only and activates only when keys are present.
- Stripe is wired for subscriptions; local testing requires test keys and webhook setup.
- Integration tokens are stored in the database today; encrypt them before serious multi-user production.
