# User Guide

Last updated: 2026-05-07

This guide explains Princeps from the user's point of view.

## Core Idea

Princeps is your private AI workspace. It helps you prepare, remember, coordinate, decide, and follow through.

The assistant is useful because it can see structured workspace data such as tasks, meetings, contacts, knowledge, goals, decisions, memory, and settings. It is not limited to the current chat thread.

## Getting Started

1. Sign up or log in with email and password.
2. Choose a plan during onboarding.
3. Open `/home` for the daily overview.
4. Open `/settings` to choose language, theme, assistant behavior, integrations, and tool availability.
5. Add tasks, contacts, meetings, and knowledge so the assistant has real context.

German is the default locale. English is also supported.

## Main Areas

Home:

- Shows a time-based greeting and weather context when available.
- Weather is fetched server-side from saved location or timezone coordinates.

Chat:

- Streams answers from the configured LLM provider.
- Can use tools when the user's tier allows them.
- Uses live context from the workspace, not only chat history.

Tasks:

- Track work with status, priority, due dates, labels, meetings, and goals.
- The assistant can create, list, update, and delete tasks if the tool is active.

Meetings:

- Store meetings and lightweight appointments.
- Link participants, contacts, tasks, decisions, agenda, summary, and prep packs.
- Google Calendar can import events and push selected Princeps meetings back.

Contacts:

- Store people, roles, companies, contact info, notes, labels, and interaction history.

Knowledge:

- Upload supported documents or import selected Google Drive files.
- Princeps stores extracted text chunks and embeddings, not raw uploaded file blobs.
- The assistant can retrieve relevant chunks for answers.

Decisions, Goals, Memory, Briefings, Reports:

- Decisions capture outcomes and rationale.
- Goals organize longer-running work.
- Memory stores durable facts the assistant can reuse.
- Briefings summarize current work.
- Reports record assistant/tool activity.

Notifications:

- The notification drawer stores assistant greetings, overdue-task nudges, and system notices.
- Greetings can use weather, local time, open tasks, and preferred language.
- Notifications can be disabled in Settings.

Settings:

- Appearance: theme, language, location, timezone, notifications.
- Assistant: name, tone, address style, response length, custom prompt, automation toggles.
- Tools: enable or disable LLM tools available to your tier.
- Usage: quota and plan usage.
- Provider: LLM provider health.
- Integrations: connect, sync, disconnect external services.
- Subscription: checkout or Stripe customer portal.

## Integrations

Google Calendar:

- Connect from Settings -> Integrations.
- Sync imports events as appointments.
- Princeps can create, update, or delete linked Google events when meeting changes are pushed.

Google Drive:

- Connect from Settings -> Integrations.
- Open Knowledge to browse supported Drive files.
- Import one file at a time into the Knowledge Base.

Disconnecting removes stored integration tokens. Synced meetings and imported knowledge documents stay in Princeps unless deleted manually.

## Plans And Limits

Plans are `free`, `pro`, `premium`, and `enterprise`.

Limits cover things like:

- Stored tasks, meetings, contacts, decisions, goals, memory entries, chats, and knowledge documents.
- LLM messages, tokens, and tool calls.
- Knowledge file size and lifetime processed characters.
- Prep packs, briefings, voice requests, and proactive nudges.

Settings -> Usage shows the current snapshot. Exact live values are defined in `types/billing.ts`.

## Privacy Notes

- Workspace data is scoped to the authenticated user.
- Weather calls send coordinates to Open-Meteo, not user identity or IP.
- Knowledge uploads store parsed text and embeddings, not original file blobs.
- External integration tokens never go to the browser.
- LLM-generated greetings use token quota; deterministic overdue nudges do not.

## Common Questions

Where do I change language or theme?

- Settings -> Appearance.

Where do I change the assistant style?

- Settings -> Assistant.

Why can I not use a tool?

- It may be disabled in Settings -> Tools or unavailable on your current tier.

Why does Knowledge fail with Groq?

- Groq supports chat, but not embeddings. Knowledge upload/search needs an embedding-capable provider.

Where are password reset links in development?

- The server logs them. In development only, `GET /api/dev/reset-links` returns recent reset links.
