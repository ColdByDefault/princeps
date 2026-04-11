# Princeps

**Version:** 0.2.6

A private AI workspace that functions as a personal executive secretariat. Princeps gives individuals the same operational leverage that high-performing executives build around themselves through chiefs of staff: preparation, memory, coordination, and structured follow-through.

Every feature writes to a single user-scoped Postgres database. The LLM assistant is context-aware across all of it — not just the chat history.

---

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

The active provider is selected at runtime via the `CHAT_PROVIDER` environment variable. Embeddings fall back to the configured embed provider independently. All three providers share the same `callChat()` / `streamChat()` / `embed()` interface defined in `lib/llm-providers/`.

**Optional external services:**

- Upstash Redis — for distributed rate limiting (falls back to in-memory if absent)
- Langfuse — for LLM observability in production

---

## Tech Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack in dev)                     |
| Language         | TypeScript 5                                                  |
| UI               | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion            |
| Auth             | Better Auth — email/password, session cookies, Prisma adapter |
| Database         | PostgreSQL 18 + pgvector extension                            |
| ORM              | Prisma 7 with `@prisma/adapter-pg`                            |
| LLM providers    | Ollama · OpenAI · Groq (runtime-switchable)                   |
| Embeddings       | Ollama or OpenAI (cosine similarity via pgvector)             |
| Validation       | Zod 4                                                         |
| Rate limiting    | Upstash Ratelimit (Redis-backed or in-memory fallback)        |
| Observability    | Langfuse (production only, opt-in)                            |
| Real-time        | Server-Sent Events (SSE) for the notification stream          |
| i18n             | next-intl — English and German, cookie-aware                  |
| Containerisation | Docker Compose                                                |

---

## Architecture

The codebase is organized in strict layers. The layering is enforced by convention — every feature follows the same shape and no layer reaches into another's responsibilities.

```
prisma/schema.prisma         Data model — IDs (cuid), enums, indexes
lib/<feature>/               Server logic — Zod schemas, CRUD operations, side effects
app/api/<feature>/           API routes — thin: auth → parse → delegate → respond
lib/tools/                   LLM tool layer — registry, executor, per-feature handlers
lib/context/                 System prompt assembly — one slot file per feature
lib/llm-providers/           Provider abstraction — callChat, streamChat, embed
lib/chat/                    Chat persistence and streaming orchestration
components/<feature>/        Client UI — shell, cards, dialogs, logic/ hooks
app/(app)/<feature>/page.tsx Server pages — auth, data fetch, serialize, pass to shell
messages/{en,de}.json        i18n strings — flat namespaced keys
lib/tiers/                   Tier enforcement and quota gating
```

### LLM tool system

The assistant can take actions (create tasks, search knowledge, update contacts, etc.) using OpenAI function-calling. Tool definitions live in `lib/tools/registry.ts`. The executor in `lib/tools/executor.ts` dispatches by tool name to per-feature handler files in `lib/tools/handlers/`. Adding a new feature's tools means creating one handler file and spreading it into `HANDLERS` — the executor is never touched.

Tools are feature-agnostic: the same executor handles calls from the chat stream, cron jobs, and any future surface.

### Context assembly

Before each LLM request, `lib/context/build.ts` assembles the system prompt from slot files — one per feature (`tasks.slot.ts`, `meetings.slot.ts`, `contacts.slot.ts`, etc.). Each slot retrieves and formats a section of the user's live data. The result is a complete system message injected into every request, grounding the assistant in the user's actual workspace state.

### Server/client boundary

Modules that import Prisma, Better Auth server helpers, or LLM provider code carry `import "server-only"`. API routes and server pages enforce auth independently — middleware (`proxy.ts`) is not considered sufficient. All DB queries filter by `userId`.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ColdByDefault/Princeps.git
cd Princeps
npm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Configure environment variables

Copy the example and fill in all values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgresql://princeps:yourpassword@localhost:5432/princeps
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# LLM provider — "ollama" | "openAi" | "groq"
CHAT_PROVIDER=ollama

# Ollama (if CHAT_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
OLLAMA_EMBED_MODEL=nomic-embed-text

# OpenAI (if CHAT_PROVIDER=openAi)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small

# Groq (if CHAT_PROVIDER=groq)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# Optional: cron job protection
CRON_SECRET=your-cron-secret

# Optional: Upstash rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: Langfuse observability (production only)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=
```

### 4. Run migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

The dev server runs Turbopack and is preceded by a DB healthcheck (`scripts/db-healthcheck.ts`) that aborts startup if Postgres is unreachable.

Open `http://localhost:3000`.

---

## Features

### Authentication and Session Management

Handled entirely by [Better Auth](https://www.better-auth.com/) with email/password credentials and session cookies. Sessions are stored in Postgres via the Prisma adapter. Every API route and server page reads and validates the session independently — middleware alone is not the trust boundary.

User accounts carry a `tier` field (`free` | `pro` | `premium` | `enterprise`). `lib/tiers/enforce.ts` checks quotas against `UsageCounter` before mutating operations. Quotas include per-day and per-month LLM message limits, per-day widget chat limits, lifetime knowledge character budgets, and per-resource record caps.

### AI Chat

A streaming, multi-conversation assistant backed by the configured LLM provider. Each conversation (`Chat`) holds an ordered list of `ChatMessage` records. Conversations are titled automatically from the first user message (a separate non-streaming LLM call).

The full system prompt is assembled by `lib/context/build.ts` on every request — pulling live data from all feature slots so the assistant always has the user's current workspace state. Tool calls are handled mid-stream: the executor resolves the tool name, calls the appropriate handler, and the result is appended to the stream.

Thinking mode sends a prefixed instruction to the model and strips the `<think>...</think>` block from the streamed response before it reaches the client. A floating chat widget (`components/chat-widget/`) is mounted in the root app layout and available on every authenticated page.

**Tier limits:** messages per month, tool calls per month, chats per day, widget messages per day.

### Knowledge Base (RAG)

Users upload documents (`.txt`, `.md`, `.pdf`, `.docx`). The server parses the file using format-appropriate libraries, chunks the text, generates an embedding for each chunk via the configured embed provider, and stores the vectors in `KnowledgeChunk.embedding` (a `pgvector` column). No raw file blob is ever persisted.

On every chat request the user's message is embedded and a cosine-similarity query over `KnowledgeChunk` retrieves the top-N most relevant chunks, which are injected into the system prompt as a dedicated context slot.

Users also maintain a single **Personal Info** record — free-form text that is always prepended to the system prompt regardless of semantic relevance.

**Tier limits:** max documents stored, max single file size, lifetime characters processed (never decrements on delete — prevents delete-and-reupload bypass).

### Notification Inbox

A persistent inbox for LLM-generated and system notifications. The `Notification` model stores category, title, body, read state, and a dismissal flag. The notification stream is delivered to connected clients via Server-Sent Events (`app/api/notifications/stream/`). Unread count is computed server-side and reflected in navigation in real time.

Notifications are generated by the LLM (briefings, nudges, greeting), by cron jobs, and by system events. The LLM-generated body is produced with a lightweight non-streaming call.

### Contacts

A relationship index backed by the `Contact` model. Each record stores name, role, company, email, phone, notes, tags, a last-contact date, and a `ContactInteraction` log. Contacts are exposed to the LLM via `lib/context/contacts.slot.ts` and are referenceable by name in tool calls via `lib/tools/resolvers.ts`.

**Shareable card links** — the `ShareToken` model issues a signed, time-limited token (24-hour TTL) that renders a read-only contact card to unauthenticated recipients.

### Meetings

The `Meeting` model stores title, date, duration, location, agenda, status (`scheduled` | `in_progress` | `completed` | `cancelled`), and a free-text summary field. Participants are stored in a `MeetingParticipant` join table linked to `Contact`. Meetings are exposed to the context slot layer and are referenceable in tool calls by title.

Google Calendar events are imported via the OAuth 2.0 integration (read-only scope). Imported events are created as `Meeting` records; subsequent syncs update rather than duplicate. Token refresh runs automatically; revoked-access errors are detected and the integration is deactivated cleanly.

**Tier limits:** max total meetings stored.

### Tasks

The `Task` model stores title, notes, status (`open` | `in_progress` | `done` | `cancelled`), priority (`low` | `normal` | `high` | `urgent`), due date, and an optional `meetingId` foreign key. Tasks are included in the daily briefing slot and the overdue nudge cron. The assistant can create, update, and complete tasks via tool calls.

**Tier limits:** max total tasks stored.

### Decisions

The `Decision` model stores title, rationale, outcome, status (`open` | `decided` | `reversed`), and an optional `meetingId` link to the meeting where the decision was made. Open decisions are surfaced in context so the assistant can avoid re-litigating settled reasoning.

**Tier limits:** max total decisions stored.

### Goals

The `Goal` feature tracks longer-horizon objectives with title, description, target date, and status. Goals are exposed through a context slot and are manageable via LLM tool calls.

### Memory

User-authored memory entries (`MemoryEntry`) are free-form notes the assistant stores and can later retrieve. The memory context slot surfaces recent entries directly in the system prompt. Memory is distinct from the knowledge base — it is structured around personal recall rather than document retrieval.

### Reports

`AssistantReport` records aggregate activity across meetings, tasks, and decisions into a structured weekly digest. Report generation is triggered on demand or by the weekly cron. Output is rendered in a dedicated reports view.

### Labels

A cross-feature tagging system. `Label` records carry name and color. Labels attach to tasks, meetings, contacts, and decisions via separate join tables (`LabelOnTask`, `LabelOnMeeting`, etc.). The tool layer resolves label names to IDs with auto-create (`lib/tools/resolvers.ts`), so the assistant can tag items by name without prior setup.

### Daily Briefing

On each briefing trigger (cron or manual), `lib/briefings/` assembles a prompt from the user's agenda, open tasks, pending decisions, and goals, sends a non-streaming LLM call, and stores the result as a `BriefingCache` record and a `Notification`. Cadence is configurable per user (off / daily / weekly) from App Settings.

### Proactive Nudges (Cron)

Automated notifications triggered by real data conditions, evaluated by cron jobs in `app/api/cron/`:

- **Overdue task alert** — fires when at least one task is past its due date.
- **Meeting follow-up prompt** — fires when a completed meeting has no summary captured.
- **Weekly digest** — a Friday summary of decisions made, tasks closed, and meetings held.

Each nudge type respects a per-user cooldown stored in `UsageCounter` and can be individually toggled from App Settings. Timezone-aware day-of-week targeting uses the user's stored timezone preference.

### Settings

**Assistant Settings** — assistant display name, system prompt prefix override, response style hint, and raw Ollama generation parameters (temperature, top-p, top-k, context window size, repeat penalty).

**App Settings** — preferred locale (English or German), notification and briefing cadence toggles.

### Multilingual UI

All user-visible strings are managed through `next-intl` with flat namespaced keys in `messages/de.json` and `messages/en.json`. German is the default locale. The active locale is resolved server-side from a cookie set by the locale middleware and persisted in user preferences. Technical text, validation errors, and logs remain in English.

---

## Copyright

Copyright © 2026 Yazan Abo-Ayash (ColdByDefault™). All rights reserved.

Princeps is proprietary software. The source code is published for reference and transparency purposes only. No license is granted to use, copy, modify, distribute, sublicense, or deploy this software or any portion of it without explicit written permission from the copyright holder.

See [LICENSE](LICENSE) for the full terms.

---

## Acceptable Use

Princeps is a personal productivity tool designed for lawful individual use. By deploying or operating this software you agree not to:

- Use the platform to store, process, or transmit unlawful, harmful, or fraudulent content.
- Attempt to access, extract, or interfere with another user's data.
- Reverse-engineer, decompile, or redistribute any part of this codebase without authorization.
- Use automated tooling to abuse or overload the API, LLM endpoints, or database.
- Bypass authentication, authorization, or rate-limiting controls.

Violation of these terms may result in account termination and, where applicable, legal action.

---

## Security

Security issues should be reported privately — not in public issues or pull requests.

**Contact:**

- contact@coldbydefault.com
- abo.ayash.yazan@gmail.com

Include a short description of the issue, the affected area or endpoint, reproduction steps, and expected impact. See [SECURITY.md](SECURITY.md) for the full policy.

Please allow reasonable time for review and remediation before any public disclosure.
