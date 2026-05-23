# Princeps

**Version:** 1.1.4

A private AI workspace that functions as a personal executive secretariat. Princeps gives individuals the same operational leverage that high-performing executives build around themselves through chiefs of staff: preparation, memory, coordination, and structured follow-through.

Every feature writes to a single user-scoped Postgres database. The LLM assistant is context-aware across all of it — not just the chat history.

---

[![Tests](https://github.com/ColdByDefault/princeps/actions/workflows/tests.yml/badge.svg)](https://github.com/ColdByDefault/princeps/actions/workflows/tests.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

## Requirements

| Requirement             | Minimum version    |
| ----------------------- | ------------------ |
| Node.js                 | 20                 |
| npm                     | 10                 |
| Docker & Docker Compose | any recent version |
| PostgreSQL (via Docker) | 18 with pgvector   |

**LLM provider (choose one):**

| Provider | Purpose                                   |
| -------- | ----------------------------------------- |
| Ollama   | Local chat completions + local embeddings |
| OpenAI   | Chat completions + embeddings via API     |
| Groq     | Chat completions via API (no embeddings)  |

All providers share the same `callChat()` / `streamChat()` / `embed()` interface defined in `lib/ai/llm-providers/`. The active provider is selected with `CHAT_PROVIDER`. Knowledge upload and semantic search require an embedding-capable provider, so use `openAi` or `ollama` when working with Knowledge. Groq is chat-only.

**Optional external services:**

- Upstash Redis — for distributed rate limiting (falls back to in-memory if absent)
- Langfuse — for LLM observability in production
- Stripe — for billing and subscription management
- Google Calendar — for calendar import and optional event write-back
- Google Drive — for browsing and importing supported Drive files into Knowledge

---

## Tech Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Next.js 16.2 (App Router, Turbopack in dev)                   |
| Language         | TypeScript 5                                                  |
| UI               | React 19, Tailwind CSS 4, shadcn/ui, Motion                   |
| Auth             | Better Auth — email/password, session cookies, Prisma adapter |
| Database         | PostgreSQL 18 + pgvector extension                            |
| ORM              | Prisma 7 with `@prisma/adapter-pg`                            |
| LLM providers    | Ollama · OpenAI · Groq (runtime-switchable)                   |
| Embeddings       | Ollama or OpenAI (cosine similarity via pgvector)             |
| Validation       | Zod 4                                                         |
| Rate limiting    | Upstash Ratelimit (Redis-backed or in-memory fallback)        |
| Observability    | Langfuse (production only, opt-in)                            |
| Billing          | Stripe (subscriptions, customer portal, webhook sync)         |
| Streaming        | Server-Sent Events (SSE) for chat and widget responses        |
| i18n             | next-intl 4 — English and German, cookie-aware                |
| Containerisation | Docker Compose                                                |

---

## Architecture

The codebase is organized in strict layers. The layering is enforced by convention — every feature follows the same shape and no layer reaches into another's responsibilities.

```
prisma/schema.prisma         Data model — IDs (cuid), enums, indexes
lib/features/<feature>/               Server logic — Zod schemas, CRUD operations, side effects
app/api/<feature>/           API routes — thin: auth → parse → delegate → respond
lib/ai/tools/                   LLM tool layer — registry, executor, per-feature handlers
lib/ai/context/                 System prompt assembly — one slot file per feature
lib/ai/llm-providers/           Provider abstraction — callChat, streamChat, embed
lib/features/chat/                    Chat persistence and streaming orchestration
components/<feature>/        Client UI — shell, cards, dialogs, logic/ hooks
app/(app)/<feature>/page.tsx Server pages — auth, data fetch, serialize, pass to shell
messages/{en,de}.json        i18n strings — namespaced keys
lib/platform/tiers/                   Tier enforcement and quota gating
lib/platform/stripe/                  Billing — checkout, portal, webhook sync
```

### LLM tool system

The assistant can take actions (create tasks, search knowledge, update contacts, etc.) using function-calling. Tool definitions live in `lib/ai/tools/registry/` and are collected by `lib/ai/tools/registry.ts`. The executor in `lib/ai/tools/executor.ts` dispatches by tool name to per-feature handler files in `lib/ai/tools/handlers/`. Adding a new feature's tools means creating registry and handler files, then registering them in the central registry and handler map.

Tools are feature-agnostic: the same executor handles calls from the chat stream, cron jobs, and any future surface.

### Context assembly

Before each LLM request, `lib/ai/context/build.ts` assembles the system prompt from slot files — one per feature (`tasks.slot.ts`, `meetings.slot.ts`, `contacts.slot.ts`, etc.). Each slot retrieves and formats a section of the user's live data. The result is a complete system message injected into every request, grounding the assistant in the user's actual workspace state.

### Server/client boundary

Modules that import Prisma, Better Auth server helpers, or LLM provider code carry `import "server-only"`. API routes and server pages enforce auth independently — middleware (`proxy.ts`) is not considered sufficient. User-facing DB queries filter by `userId` unless a route is intentionally system-scoped, such as a cron job.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ColdByDefault/princeps.git
cd princeps
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

At minimum, set the database password, `DATABASE_URL`, Better Auth values, and one chat provider:

```dotenv
POSTGRES_USER="princeps"
POSTGRES_PASSWORD="replace-with-a-strong-local-password"
POSTGRES_DB="princeps"
DATABASE_URL="postgresql://princeps:replace-with-a-strong-local-password@localhost:5432/princeps"

BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"

CHAT_PROVIDER="openAi"
OPENAI_API_KEY="replace-with-your-key"
OPENAI_CHAT_MODEL="replace-with-your-model"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

For local AI, use the Ollama entries in `.env.example`. Groq can be used for chat, but Knowledge upload/search needs `CHAT_PROVIDER` set to `openAi` or `ollama` because embeddings are required.

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

The dev server runs Turbopack and is preceded by a DB healthcheck (`scripts/db-healthcheck.ts`) that aborts startup if Postgres is unreachable.

Open `http://localhost:3000`.

### Useful commands

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Run the development server after checking database availability |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with automatic fixes |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:seed` | Seed development data |
| `npm run db:seed:reset` | Reset seed data through the seed script |
| `npm run db:reset` | Reset Prisma migrations and database state |

---

## Features

### Authentication and Session Management

Handled entirely by [Better Auth](https://www.better-auth.com/) with email/password credentials and session cookies. Sessions are stored in Postgres via the Prisma adapter. Every API route and server page reads and validates the session independently — middleware alone is not the trust boundary.

User accounts carry a `tier` field (`free` | `pro` | `premium` | `enterprise`). `lib/platform/tiers/enforce.ts` checks quotas against `UsageCounter` before mutating operations. Quotas include per-day and per-month LLM message limits, per-day widget chat limits, lifetime knowledge character budgets, and per-resource record caps.

### Billing and Subscriptions

Billing is handled by Stripe. `lib/platform/stripe/` contains checkout session creation, customer portal access, and webhook sync. Subscription events update the user's `tier` and `stripeCustomerId` via Stripe webhooks. A pricing page (`/pricing`) renders plan cards driven by the tier configuration in `types/billing.ts`.

### AI Chat

A streaming, multi-conversation assistant backed by the configured LLM provider. Each conversation (`Chat`) holds an ordered list of `ChatMessage` records. Conversations are titled automatically from the first user message (a separate non-streaming LLM call).

The full system prompt is assembled by `lib/ai/context/build.ts` on every request — pulling live data from feature slots so the assistant has the user's current workspace state. Tool calls are handled mid-stream: the executor resolves the tool name, calls the appropriate handler, and feeds the result back into the conversation.

A floating chat widget (`components/chat-widget/`) is mounted in the root app layout and available on every authenticated page.

**Tier limits:** messages per month, tool calls per month, chats per day, widget messages per day.

### Knowledge Base (RAG)

Users can upload text and Markdown files (`.txt`, `.md`, `.markdown`) or import supported Google Drive files. Drive import currently supports Google Docs, Sheets, Slides, and PDFs. The server extracts text, chunks it, generates an embedding for each chunk through the active provider, and stores the vectors in `KnowledgeChunk.embedding` (a `pgvector` column). No raw file blob is persisted.

On every chat request the user's message is embedded and a cosine-similarity query over `KnowledgeChunk` retrieves the top-N most relevant chunks, which are injected into the system prompt as a dedicated context slot.

**Tier limits:** max documents stored, max single file size, lifetime characters processed (never decrements on delete — prevents delete-and-reupload bypass).

### Notification Inbox

A persistent inbox for assistant and system notifications. The `Notification` model stores category, title, body, read state, and a dismissal flag. The client loads notifications through authenticated API routes and refreshes the inbox after chat or widget flows create new server-side notifications.

Notifications are generated by greetings, overdue-task nudges, assistant reports, cron jobs, and system events.

### Contacts

A relationship index backed by the `Contact` model. Each record stores name, role, company, email, phone, notes, a last-contact date, and labels. Contacts are exposed to the LLM via `lib/ai/context/contacts.slot.ts` and are referenceable by name in tool calls via `lib/ai/tools/resolvers.ts`.

### Meetings

The `Meeting` model stores title, date, duration, location, agenda, status (`upcoming` | `done` | `cancelled`), and a free-text summary field. Participants are stored in a `MeetingParticipant` join table linked to `Contact`. Meetings are exposed to the context slot layer and are referenceable in tool calls by title.

Google Calendar events are imported via the OAuth 2.0 integration (`lib/platform/integrations/google-calendar/`). Imported events are created as `Meeting` records; subsequent syncs update rather than duplicate. Princeps can also create, update, or delete linked Google Calendar events when the user opts to push a meeting to Google Calendar. Token refresh runs automatically; revoked-access errors are surfaced cleanly.

**Tier limits:** max total meetings stored.

### Tasks

The `Task` model stores title, notes, status (`open` | `in_progress` | `done` | `cancelled`), priority (`low` | `normal` | `high` | `urgent`), due date, and an optional `meetingId` foreign key. Tasks are included in the daily briefing slot and the overdue nudge cron. The assistant can create, update, and complete tasks via tool calls.

**Tier limits:** max total tasks stored.

### Decisions

The `Decision` model stores title, rationale, outcome, status (`open` | `decided` | `reversed`), and an optional `meetingId` link to the meeting where the decision was made. Open decisions are surfaced in context so the assistant can avoid re-litigating settled reasoning.

**Tier limits:** max total decisions stored.

### Goals

The `Goal` feature tracks longer-horizon objectives with title, description, target date, and status (`open` | `in_progress` | `done` | `cancelled`). Goals are exposed through a context slot and are manageable via LLM tool calls.

### Memory

User-authored memory entries (`MemoryEntry`) are free-form notes the assistant stores and can later retrieve. They carry a `source` field (`llm` | `user`) so manually added entries are distinguished from assistant-generated ones. The memory context slot surfaces recent entries directly in the system prompt. Memory is distinct from the knowledge base — it is structured around personal recall rather than document retrieval.

### Reports

`AssistantReport` records assistant/tool activity for chat interactions: tools called, approximate token use, and structured call details. Reports can create system notifications and are rendered in a dedicated reports view.

### Labels

A cross-feature organization system. `Label` records carry name, color, and optional icon. Labels attach to tasks, meetings, contacts, decisions, goals, and knowledge documents via separate join tables (`LabelOnTask`, `LabelOnMeeting`, etc.). The tool layer resolves label names to IDs with auto-create (`lib/ai/tools/resolvers.ts`), so the assistant can tag items by name without prior setup.

### Daily Briefing

On each briefing trigger (cron or manual), `lib/features/briefings/` assembles a prompt from the user's agenda, open tasks, and pending decisions, sends a non-streaming LLM call, and stores the result as a `BriefingCache` record. Automatic daily briefings can be toggled from Assistant settings.

### Scheduled Automations (Cron)

Scheduled workflows live under `app/api/cron/`:

- **Overdue task alert** — creates notifications when tasks are past their due date.
- **Meeting status maintenance** — marks elapsed upcoming meetings as done.
- **Weekly review agent** — executes the weekly-review sub-agent for pro+ users.
- **Signal feed agent** — runs configured topic monitoring for pro+ users and stores useful digests in Knowledge.

Overdue task nudges respect plan availability and user notification preferences. Automatic daily briefings and overdue-task nudges can be toggled from Assistant settings.

### Settings

**Assistant Settings** — assistant display name, tone, address style, response length, custom system prompt, automatic briefing toggle, activity reports toggle, and overdue-task nudge toggle.

**Appearance Settings** — theme, preferred locale (English or German), saved location, timezone, and notification toggle.

**Provider, integrations, usage, and subscription settings** — provider health, connected Google services, plan usage, and Stripe subscription management.

### Multilingual UI

All user-visible strings are managed through `next-intl` with namespaced keys in `messages/de.json` and `messages/en.json`. German is the default locale. The active locale is resolved server-side from a language cookie, authenticated user preferences, or the request's `Accept-Language` header. Technical text, validation errors, and logs remain in English.

---

## License

Princeps is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

You may run, study, modify, and redistribute Princeps under the terms of that license. If you modify Princeps and make the modified version available to users over a network, the AGPL includes source-availability obligations for that modified version.

See [LICENSE](LICENSE) for the governing terms.

Copyright © 2026 Yazan Abo-Ayash (ColdByDefault © AnotherProject™). All rights reserved.

---

## Acceptable Use

Princeps is a personal productivity tool designed for lawful individual use. By deploying or operating this software you agree not to:

- Use the platform to store, process, or transmit unlawful, harmful, or fraudulent content.
- Attempt to access, extract, or interfere with another user's data.
- Redistribute modified versions except as permitted by the project license.
- Use automated tooling to abuse or overload the API, LLM endpoints, or database.
- Bypass authentication, authorization, or rate-limiting controls.

Violation of these terms may result in account termination and, where applicable, legal action.

---

## Security

Security issues should be reported privately — not in public issues or pull requests.

**Contact:**

- contact@coldbydefault.com

Include a short description of the issue, the affected area or endpoint, reproduction steps, and expected impact. See [SECURITY.md](SECURITY.md) for the full policy.

Please allow reasonable time for review and remediation before any public disclosure.
