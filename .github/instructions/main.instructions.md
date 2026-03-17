---
description: "Use when you need the high-level shape of the See-Sweet repository. Covers product intent, feature boundaries, and repository-wide architecture."
name: "See-Sweet Repo Overview"
---

# See-Sweet Repo Overview

## Product Intent

- See-Sweet should feel like a private executive secretariat or chief-of-staff system, similar to the support structure major CEOs rely on, but adapted for one authenticated user workspace.
- The product is not just a generic chatbot. It should coordinate chat, knowledge, tasks, contacts, meetings, decisions, and assistant behavior across sessions.
- Keep changes aligned with the product's core shape: user-scoped data, retrieval-backed chat, configurable assistant behavior, multilingual UI, and structured workspace flows.
- Removed features stay removed. Do not reintroduce LiveAvatar, ElevenLabs TTS, `/api/greeting`, or greeting controls in system config.

## Architecture Shape

- `app/` holds App Router pages, layouts, metadata, and API handlers.
- `components/<feature>/` holds interactive UI by feature; `components/ui/` holds shared primitives.
- `lib/<feature>/` holds server-side business logic, usually split into one operation per `*.logic.ts`.
- `types/` holds shared client-safe contracts and enums.
- `messages/`, `i18n/`, and `hooks/use-language.ts` provide localization support.
- `prisma/` holds schema, migrations, and seed scripts.

## Core Constraints

- Most data access is user-scoped. Filter by `userId` unless the code is intentionally admin-only.
- Chat behavior is assembled from system config, personal info, task context, and retrieval context in server logic.
- Keep Prisma, pgvector access, Better Auth server helpers, and other Node-only code out of client import chains.
- Keep technical, validation, and system-facing text in English.
