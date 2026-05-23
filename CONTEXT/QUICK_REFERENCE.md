# Princeps Quick Reference

**Last updated**: 2026-05-21  
**Audience**: Developers working in Princeps codebase

This is a practical reference of what Princeps can do and how each feature is built. Use it for quick lookups, onboarding, and understanding the implementation patterns.

---

## Table of Contents

1. [What Princeps Can Do](#what-princeps-can-do)
2. [Architecture Overview](#architecture-overview)
3. [Features & Implementation](#features--implementation)
4. [Orchestration Layers](#orchestration-layers)
5. [Quick Patterns](#quick-patterns)

---

## What Princeps Can Do

Princeps is a private executive secretariat / chief-of-staff workspace. Core capabilities:

### Core Features

- **Tasks**: CRUD task management with priority, status, due dates, labels, goal links
- **Meetings**: Schedule meetings, add participants, generate AI prep packs, track follow-ups
- **Contacts**: Manage people, roles, companies, track last contact, link to meetings/tasks
- **Decisions**: Track decisions, rationale, outcomes, status
- **Goals**: Define goals with milestones, track progress, link to tasks
- **Labels**: Organize everything with colored labels (tasks, meetings, contacts, decisions, goals, knowledge)
- **Memory**: Store/recall user context entries (LLM-generated or user-created)
- **Knowledge**: Upload documents (PDF, DOCX, TXT), chunk, embed, semantic search with pgvector
- **Briefings**: Daily AI-generated executive briefings (cron-triggered)
- **Reports**: Assistant action summaries (tool calls, token usage, details)

### AI Capabilities

- **Chat**: Multi-turn conversations with streaming responses, tool calling, context awareness
- **Widget Chat**: Lightweight chat sidebar for quick interactions
- **Voice Input**: Transcribe voice to text (Whisper API)
- **Context Slots**: System prompt includes user workspace data (tasks, meetings, contacts, etc.)
- **LLM Tools**: 40+ callable actions across all features
- **Web Research**: Fetch and analyze web pages
- **Drive Integration**: Import knowledge from Google Drive

### Infrastructure

- **Auth**: Email/password via Better Auth, session management
- **Tiers**: Free, Pro, Premium, Enterprise with quota/feature gates
- **Billing**: Stripe integration for subscriptions, usage tracking
- **Notifications**: Daily greetings, overdue nudges, system notices
- **Integrations**: Google Calendar sync, Google Drive import
- **i18n**: German (default) + English, fully localized UI
- **Settings**: Profile, preferences, provider status, usage dashboard, tier management

---

## Architecture Overview

### Stack

```
Next.js 15 App Router
TypeScript, React 19, Tailwind CSS
shadcn/ui + Base UI components
PostgreSQL + Prisma ORM
pgvector for embeddings
Better Auth for sessions
Stripe for billing
OpenAI / Ollama / Groq for LLM
next-intl for localization
```

### Folder Structure

```
app/(app)/<feature>/page.tsx         Server pages — auth, data fetch, SSR
components/<feature>/                Client components — UI, state, hooks
  <Feature>Shell.tsx                 Page shell with state management
  <Feature>Card.tsx                  Individual item display
  Create<Feature>Dialog.tsx          Creation form
  Edit<Feature>Dialog.tsx            Edit form
  logic/
    use<Feature>Mutations.ts         API calls, optimistic updates, toasts
lib/features/<feature>/                       Server logic — business rules
  schemas.ts                         Zod validation schemas
  create.logic.ts                    Insert + side effects
  list.logic.ts                      Queries
  update.logic.ts                    Updates + side effects
  delete.logic.ts                    Deletes + cascade
  shared.logic.ts                    DB→API mappers, shared includes
app/api/<feature>/                   API routes — thin handlers
  route.ts                           GET, POST
  [id]/route.ts                      PATCH, DELETE
lib/ai/tools/                           LLM tool orchestration
  registry/<feature>.registry.ts     Tool schemas + tier gates
  handlers/<feature>.handler.ts      Tool execution logic
  registry.ts                        Central tool registry
  executor.ts                        Tool dispatcher
lib/ai/context/                         LLM system prompt assembly
  <feature>.slot.ts                  Feature data for context
  build.ts                           Context builder
lib/ai/llm-providers/                   LLM abstraction layer
  openai/, ollama/, groq/            Provider implementations
  provider.ts                        Dispatcher
messages/de.json, en.json            All user-facing strings
prisma/schema.prisma                 Single schema, all models
```

### Request Flow

#### Standard CRUD Flow

```
User action in browser
  ↓
components/<feature>/logic/use<Feature>Mutations.ts
  ↓ fetch()
app/api/<feature>/route.ts
  → auth.api.getSession()
  → rate limit / tier gate
  → validate with Zod schemas
  ↓
lib/features/<feature>/create|list|update|delete.logic.ts
  → enforce userId ownership
  → Prisma operations via @/lib/core/db
  → map DB rows to API records
  ↓
API response (JSON)
  ↓
Hook updates local state, shows toast
  ↓
UI re-renders
```

#### Chat + Tools Flow

```
User sends message
  ↓
app/api/chat/[chatId]/stream/route.ts
  → authenticate
  → enforce monthly LLM quotas
  → build system prompt from lib/ai/context/build.ts
  → load tier-filtered tools from lib/ai/tools/registry.ts
  ↓
lib/ai/llm-providers/provider.ts
  → streamChat() with messages, tools, options
  ↓
Stream tokens + tool calls to client
  ↓
lib/ai/tools/executor.ts
  → executeToolCall(userId, toolCall)
  → validate tool is active for user
  → dispatch to feature handler
  ↓
lib/ai/tools/handlers/<feature>.handler.ts
  → validate args with Zod
  → resolve names → IDs
  → enforce tier/usage gates
  → delegate to lib/features/<feature>/
  → return ActionResult { ok, data } or { ok: false, error }
  ↓
Stream tool result to client
  ↓
Up to 6 rounds of tool→response cycles
```

---

## Features & Implementation

### Tasks

**What it does**: Manage personal tasks with priority, status, due dates, labels, goal links.

**How it's built**:

- **Model**: `Task` (id, userId, title, notes, status, priority, dueDate, meetingId, delegatedTo, delegatedAt, delegateNotes)
- **Server logic**: `lib/features/tasks/` (create, list, update, delete, shared)
- **API routes**: `GET|POST /api/tasks`, `PATCH|DELETE /api/tasks/[id]`
- **UI**: `components/tasks/TasksShell.tsx` + cards, dialogs, mutation hook; "Delegated" filter tab surfaces tasks where `delegatedTo !== null`
- **Tools**: `create_task`, `list_tasks`, `update_task`, `delete_task` (LLM-callable); `create_task`/`update_task` accept `delegatedTo` + `delegateNotes`; handler auto-stamps `delegatedAt = now()` when a name is set
- **Context slot**: `lib/ai/context/tasks.slot.ts` — open + in_progress tasks in system prompt
- **Tier gate**: `tasksMax` enforced before create (free: 20, pro: 100, premium: 500, enterprise: unlimited)

**Example usage**:

```ts
// Create task via API
POST /api/tasks
{ title: "Review Q2 report", priority: "high", dueDate: "2026-05-25T12:00:00Z", labelNames: ["work"] }

// LLM tool call
{ name: "create_task", arguments: { title: "Follow up with client", labelNames: ["sales"] } }
```

---

### Meetings

**What it does**: Schedule meetings, add participants (contacts), generate AI prep packs, track follow-up.

**How it's built**:

- **Model**: `Meeting` (id, userId, title, scheduledAt, durationMin, location, agenda, summary, prepPack, status, kind, source, googleEventId), `MeetingParticipant` join table
- **Server logic**: `lib/features/meetings/` (create, list, update, delete, prep-pack, shared)
- **API routes**: `GET|POST /api/meetings`, `PATCH|DELETE /api/meetings/[id]`, `POST /api/meetings/[id]/prep-pack`
- **UI**: `components/meetings/MeetingsShell.tsx` + dialogs, PrepPackDialog
- **Tools**: `create_meeting`, `list_meetings`, `update_meeting`, `delete_meeting`, `generate_meeting_prep_pack`
- **Context slot**: `lib/ai/context/meetings.slot.ts` — upcoming meetings in system prompt
- **Tier gate**: `prepPacksPerMonth` enforced (free: 0/disabled, pro: 10, premium: 25, enterprise: 100)
- **Integration**: Google Calendar sync via `lib/platform/integrations/google-calendar/`

**Example usage**:

```ts
// Generate prep pack
POST /api/meetings/[id]/prep-pack
// → LLM generates agenda, talking points, relevant context from knowledge/tasks

// LLM tool call
{ name: "create_meeting", arguments: { title: "Quarterly review", scheduledAt: "2026-06-01T14:00:00Z", participantNames: ["John Doe", "Jane Smith"] } }
```

---

### Contacts

**What it does**: Manage people (role, company, email, phone, notes), track last contact, link to meetings.

**How it's built**:

- **Model**: `Contact` (id, userId, name, role, company, email, phone, notes, lastContact), `ContactInteraction` tracks meeting/task links
- **Server logic**: `lib/features/contacts/` (create, list, update, delete, shared)
- **API routes**: `GET|POST /api/contacts`, `PATCH|DELETE /api/contacts/[id]`
- **UI**: `components/contact/ContactsShell.tsx` + cards, dialogs
- **Tools**: `create_contact`, `list_contacts`, `update_contact`, `delete_contact`
- **Context slot**: `lib/ai/context/contacts.slot.ts` — recent contacts in system prompt
- **Tier gate**: `contactsMax` enforced (free: 50, pro: 500, premium: 2000, enterprise: unlimited)

**Example usage**:

```ts
// Create contact via API
POST /api/contacts
{ name: "Alice Johnson", role: "CTO", company: "Acme Corp", email: "alice@acme.com" }

// LLM tool call
{ name: "create_contact", arguments: { name: "Bob Smith", company: "TechStart" } }
```

---

### Decisions

**What it does**: Track decisions, rationale, outcomes, status (open/decided/reversed), link to meetings.

**How it's built**:

- **Model**: `Decision` (id, userId, title, rationale, outcome, status, decidedAt, meetingId)
- **Server logic**: `lib/features/decisions/` (create, list, update, delete, shared)
- **API routes**: `GET|POST /api/decisions`, `PATCH|DELETE /api/decisions/[id]`
- **UI**: `components/decisions/DecisionsShell.tsx` + cards, dialogs
- **Tools**: `create_decision`, `list_decisions`, `update_decision`, `delete_decision`
- **Context slot**: `lib/ai/context/decisions.slot.ts` — recent open decisions in system prompt
- **Tier gate**: `decisionsMax` enforced (free: 20, pro: 100, premium: 500, enterprise: unlimited)

**Example usage**:

```ts
// Create decision via API
POST /api/decisions
{ title: "Migrate to microservices", rationale: "Improve scalability", status: "open" }

// LLM tool call
{ name: "create_decision", arguments: { title: "Hire senior engineer", rationale: "Team capacity" } }
```

---

### Goals

**What it does**: Define goals with milestones, track progress, link to tasks, and map stakeholder relationships per goal.

**How it's built**:

- **Model**: `Goal`, `Milestone`, `TaskOnGoal`, `StakeholderEntry` (id, userId, goalId?, contactId, role?, health, notes?)
- **Server logic**: `lib/features/goals/` (create, list, update, delete, milestones, shared), `lib/features/stakeholders/` (create, list, update, delete, shared, schemas)
- **API routes**: `GET|POST /api/goals`, `PATCH|DELETE /api/goals/[id]`, `POST /api/goals/[id]/milestones`, `PATCH|DELETE /api/goals/[id]/milestones/[milestoneId]`, `GET|POST /api/stakeholders`, `PATCH|DELETE /api/stakeholders/[id]`
- **UI**: `components/goals/GoalsShell.tsx` + dialogs, milestone management, `StakeholderMapDialog`
- **Tools**: `create_goal`, `list_goals`, `update_goal`, `delete_goal`, `add_milestone`, `complete_milestone`, `add_stakeholder`, `list_stakeholders`, `update_stakeholder_health`
- **Context slot**: `lib/ai/context/goals.slot.ts` — open + in_progress goals in system prompt
- **Tier gate**: `goalsMax` enforced (free: 5, pro: 25, premium: 100, enterprise: unlimited)

**Example usage**:

```ts
// Create goal with milestone
POST /api/goals
{ title: "Launch v2.0", targetDate: "2026-12-31", status: "in_progress" }
POST /api/goals/[id]/milestones
{ title: "Complete backend API", targetDate: "2026-08-15" }

// LLM tool call
{ name: "create_goal", arguments: { title: "Increase revenue 20%", targetDate: "2026-12-31" } }
```

---

### Labels

**What it does**: Organize everything with colored labels (tasks, meetings, contacts, decisions, goals, knowledge).

**How it's built**:

- **Model**: `Label` (id, userId, name, color, icon, normalizedName), join tables for each feature
- **Server logic**: `lib/features/labels/` (create, list, update, delete, shared)
- **API routes**: `GET|POST /api/labels`, `PATCH|DELETE /api/labels/[id]`
- **UI**: `components/labels/LabelsShell.tsx` + dialogs, color/icon picker
- **Tools**: `create_label`, `list_labels`, `update_label`, `delete_label`
- **Context slot**: `lib/ai/context/labels.slot.ts` — all labels in system prompt (for name resolution)
- **Resolvers**: `lib/ai/tools/resolvers.ts` — `resolveOrCreateLabelIdsByNames()` used by all feature tools
- **Tier gate**: `labelsMax` enforced (free: 10, pro: 50, premium: 200, enterprise: unlimited)

**Example usage**:

```ts
// Create label
POST /api/labels
{ name: "urgent", color: "#ef4444", icon: "Zap" }

// LLM resolves label names → IDs when creating tasks/meetings/etc
// Tools accept labelNames: ["work", "urgent"]
// Handler calls resolveOrCreateLabelIdsByNames(userId, labelNames)
```

---

### Memory

**What it does**: Store/recall user context entries (facts, preferences, past interactions), LLM-generated or user-created.

**How it's built**:

- **Model**: `MemoryEntry` (id, userId, content, source, createdAt)
- **Server logic**: `lib/features/memory/` (create, list, update, delete, shared)
- **API routes**: `GET|POST /api/memory`, `PATCH|DELETE /api/memory/[id]`
- **UI**: `components/memory/MemoryShell.tsx` + dialogs
- **Tools**: `save_memory`, `list_memory`, `update_memory`, `delete_memory`
- **Context slot**: `lib/ai/context/memory.slot.ts` — recent memory entries in system prompt
- **Tier gate**: `memoryEntriesMax` enforced (free: 20, pro: 200, premium: 1000, enterprise: unlimited)

**Example usage**:

```ts
// Save memory entry
POST /api/memory
{ content: "User prefers 9 AM meetings", source: "llm" }

// LLM tool call
{ name: "save_memory", arguments: { content: "User allergic to peanuts" } }
```

---

### Knowledge

**What it does**: Upload documents (PDF, DOCX, TXT), extract text, chunk, embed, semantic search with pgvector.

**How it's built**:

- **Model**: `KnowledgeDocument` (id, userId, name, charCount, sourceType, sourceId), `KnowledgeChunk` (id, documentId, userId, content, embedding as vector(1536), chunkIndex)
- **Server logic**: `lib/features/knowledge/` (upload, list, delete, search, extract, embed, shared)
- **API routes**: `POST /api/knowledge/upload`, `GET|DELETE /api/knowledge`, `DELETE /api/knowledge/[id]`
- **UI**: `components/knowledge/KnowledgeShell.tsx` + upload dialog, search, preview
- **Tools**: `search_knowledge`, `upload_knowledge_document`, `list_knowledge_documents`, `delete_knowledge_document`
- **Context slot**: Knowledge chunks are NOT in base system prompt (too large); retrieved on-demand via search
- **Tier gates**: `knowledgeDocsMax`, `knowledgeSizeMaxMB`, `knowledgeCharsUsed` (lifetime counter)
- **Integration**: Google Drive import via `lib/platform/integrations/google-drive/`
- **Tech**: Uses `mammoth` for DOCX, `pdf-parse` for PDF, pgvector cosine similarity for search

**Example usage**:

```ts
// Upload document
POST /api/knowledge/upload
FormData: file (PDF/DOCX/TXT)
// → Extract text → Chunk (2000 chars) → Embed each chunk → Store in DB

// Search knowledge
GET /api/knowledge?q=quarterly%20revenue
// → Embed query → pgvector similarity search → Return top chunks + source docs

// LLM tool call
{ name: "search_knowledge", arguments: { query: "company policy on remote work", limit: 5 } }
```

---

### Chat

**What it does**: Multi-turn AI conversations with streaming, tool calling, context awareness, voice input.

**How it's built**:

- **Model**: `Chat` (id, userId, title), `ChatMessage` (id, chatId, role, content, thinking)
- **Server logic**: `lib/features/chat/` (create-chat, list-chats, delete-chat, shared)
- **API routes**: `POST /api/chat` (create chat), `GET|DELETE /api/chat`, `POST /api/chat/[chatId]/stream` (SSE streaming), `POST /api/chat/transcribe` (Whisper voice)
- **UI**: `components/chat/ChatInterface.tsx` + message list, input, voice recording, typing indicator
- **Widget**: `components/chat-widget/WidgetChat.tsx` — sidebar chat, separate quota
- **Providers**: `lib/ai/llm-providers/` — OpenAI, Ollama, Groq
- **Context**: `lib/ai/context/build.ts` — assembles system prompt from slots
- **Tools**: All 40+ tools in `lib/ai/tools/registry.ts` available during chat
- **Tier gates**: `messagesPerMonth`, `tokensPerMonth`, `toolCallsPerMonth`, `chatsPerDay`, `voiceRequestsPerDay`

**Example usage**:

```ts
// Stream chat
POST / api / chat / [chatId] / stream;
{
  messages: [{ role: "user", content: "What tasks are overdue?" }];
}
// → Build context → Stream response → LLM calls list_tasks tool → Execute → Stream result → Continue

// Transcribe voice
POST / api / chat / transcribe;
FormData: audio(webm, wav);
// → Whisper API → Return { text: "..." }
```

---

### Briefings

**What it does**: Daily AI-generated executive briefings (tasks, meetings, decisions, goals summary).

**How it's built**:

- **Model**: `BriefingCache` (id, userId, content, generatedAt) — singleton per user
- **Server logic**: `lib/features/briefings/` (generate, get, shared)
- **API routes**: `POST /api/briefings` (generate), `GET /api/briefings` (retrieve cached)
- **Cron**: `POST /api/cron/briefing` — scheduled daily generation
- **Tools**: `generate_briefing`, `get_briefing`
- **Tier gates**: `briefingMonthlyCount`, `briefingDailyCount` (free: 0/disabled, pro: 1/day, premium: 2/day, enterprise: 5/day)

**Example usage**:

```ts
// Generate briefing
POST /api/briefings
// → Query tasks, meetings, decisions, goals → LLM summarizes → Cache result → Return

// Cron triggers daily
POST /api/cron/briefing (Authorization: Bearer <CRON_SECRET>)
// → Generate for all eligible users
```

---

### Notifications

**What it does**: Daily greetings, overdue nudges, system notices, persistent inbox.

**How it's built**:

- **Model**: `Notification` (id, userId, category, source, title, body, read, dismissed, metadata)
- **Server logic**: `lib/features/notifications/` (list, mark-read, delete, greeting, nudge-overdue)
- **API routes**: `GET|DELETE /api/notifications`, `PATCH|DELETE /api/notifications/[id]`, `POST /api/notifications/greeting`
- **Cron**: `POST /api/cron/tasks-overdue` — creates overdue-task notifications
- **UI**: `components/notifications/NotificationBell.tsx` + drawer
- **Weather**: `lib/services/weather/` — enriches daily greetings with weather context
- **Tier gate**: `preferences.notificationsEnabled` can disable

**Example usage**:

```ts
// Generate daily greeting
POST /api/notifications/greeting
// → Check today's greeting exists → Fetch weather → Load tasks → LLM generates greeting → Create notification

// Cron overdue nudge
POST /api/cron/tasks-overdue (Authorization: Bearer <CRON_SECRET>)
// → Find overdue tasks → Create notifications for users
```

---

### Reports

**What it does**: Track assistant actions (tool calls, token usage, key-value summaries per tool invocation).

**How it's built**:

- **Model**: `AssistantReport` (id, userId, toolsCalled, toolCallCount, tokenUsage, details as JSON)
- **Server logic**: `lib/features/reports/` (create, list, delete, shared)
- **API routes**: `GET|DELETE /api/reports`, `DELETE /api/reports/[id]`
- **UI**: `components/reports/ReportsShell.tsx` — read-only list, detail view
- **Created by**: Chat stream route after tool execution rounds complete

**Example usage**:

```ts
// Chat creates report after tool calls
// details: [{ tool: "create_task", key: "Task created", value: "Review Q2 report" }, ...]

// List reports
GET / api / reports;
```

---

### Integrations

**What it does**: Connect external services (Google Calendar, Google Drive).

**How it's built**:

- **Model**: `Integration` (id, userId, provider, accessToken, refreshToken, expiresAt, lastSyncedAt)
- **Server logic**: `lib/platform/integrations/google-calendar/`, `lib/platform/integrations/google-drive/`
- **API routes**:
  - Google Calendar: `POST /api/integrations/google-calendar/connect|disconnect|callback|sync`
  - Google Drive: `POST /api/integrations/google-drive/connect|disconnect|callback|sync|import`
- **UI**: `components/settings/IntegrationsTab.tsx` — connect/disconnect buttons, sync status
- **OAuth flow**: connect → Google OAuth → callback → store tokens → sync
- **Sync**: Import Google Calendar events → create/update Meetings; Import Drive files → upload to Knowledge

**Example usage**:

```ts
// Connect Google Calendar
POST /api/integrations/google-calendar/connect
// → Redirect to Google OAuth → Callback stores tokens

// Sync calendar
POST /api/integrations/google-calendar/sync
// → Fetch events → Create/update Meeting records → Return sync summary

// Import Drive files
POST /api/integrations/google-drive/import
{ fileIds: ["1abc...", "2def..."] }
// → Download files → Upload to knowledge → Return import summary
```

---

### Settings

**What it does**: Manage profile, preferences, tier/billing, usage dashboard, provider status, integrations.

**How it's built**:

- **Server logic**: `lib/platform/settings/`, `lib/features/profile/`, `lib/platform/stripe/`
- **API routes**: `GET|PATCH /api/settings`, `GET /api/settings/usage`, `GET /api/settings/provider-status`, `POST /api/stripe/checkout|portal`
- **UI**: `components/settings/` — tabs for profile, preferences, tier, usage, integrations, provider
- **Tabs**: ProfileTab, PreferencesTab, TierTab, UsageTab, IntegrationsTab, ProviderTab
- **Stripe**: Checkout session for upgrades, customer portal for subscriptions

**Example usage**:

```ts
// Update preferences
PATCH /api/settings
{ preferences: { language: "en", notificationsEnabled: false, disabledTools: ["delete_task"] } }

// Get usage summary
GET /api/settings/usage
// → Returns current counts vs limits for tasks, contacts, messages, tokens, prep packs, etc

// Create checkout session
POST /api/stripe/checkout
{ priceId: "price_pro_monthly" }
// → Redirect to Stripe → After payment, webhook updates tier
```

---

## Orchestration Layers

### LLM Providers

**What it does**: Abstraction layer for OpenAI, Ollama, Groq — chat, streaming, embeddings.

**How it's built**:

- **Files**: `lib/ai/llm-providers/openai/`, `lib/ai/llm-providers/ollama/`, `lib/ai/llm-providers/groq/`, `lib/ai/llm-providers/provider.ts`
- **Public API**: `callChat(messages, options)`, `streamChat(messages, options)`, `embed(text)`, `embedBatch(texts)`
- **Env**: `CHAT_PROVIDER=openAi|ollama|groq` selects provider
- **Observability**: Langfuse tracing in production (optional)
- **Types**: `types/llm.ts` — LLMMessage, LLMChatOptions, LLMChatResult, LLMToolCall

**Example usage**:

```ts
import { streamChat } from "@/lib/llm-providers";

const stream = await streamChat(messages, {
  model: "gpt-4o",
  temperature: 0.7,
  tools: activeTools,
});

for await (const chunk of stream) {
  if (chunk.type === "content") {
    // Stream token
  } else if (chunk.type === "tool_call") {
    // Execute tool
  }
}
```

---

### LLM Tools

**What it does**: Orchestration layer for 40+ assistant-callable actions across all features.

**How it's built**:

- **Registry**: `lib/ai/tools/registry/<feature>.registry.ts` — OpenAI function schemas + `minTier` + `group`
- **Handlers**: `lib/ai/tools/handlers/<feature>.handler.ts` — validate args, resolve names, enforce gates, delegate to `lib/features/<feature>/`
- **Orchestration**: `lib/ai/tools/registry.ts` spreads all feature registries, `lib/ai/tools/executor.ts` dispatches by tool name
- **Active tools**: `getActiveToolsForUser(userId)` filters by tier + disabled preferences
- **Result type**: `ActionResult = { ok: true, data } | { ok: false, error }`

**Example usage**:

```ts
// Registry entry
{
  minTier: "free",
  group: "tasks",
  type: "function",
  function: {
    name: "create_task",
    description: "Create a new task...",
    parameters: { type: "object", properties: { title: { type: "string" }, ... } }
  }
}

// Handler
export async function create_task(userId: string, args: Record<string, unknown>): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await enforceTasksMax(userId);
  const task = await createTask(userId, parsed.data);
  return { ok: true, data: task };
}

// Executor
const result = await executeToolCall(userId, { function: { name: "create_task", arguments: "{...}" } });
```

---

### Context Assembly

**What it does**: Build system prompt with user workspace data (tasks, meetings, contacts, labels, goals, memory, decisions).

**How it's built**:

- **Slots**: `lib/ai/context/<feature>.slot.ts` — fetch relevant data, format for system prompt
- **Builder**: `lib/ai/context/build.ts` — assembles all slots + base instructions
- **Used by**: Chat stream route before calling LLM
- **Dynamic**: Only includes slots with data (skips empty sections)

**Example usage**:

```ts
import { buildContext } from "@/lib/context";

const systemPrompt = await buildContext(userId, locale);
// → "You are Princeps, the user's executive assistant.\n\n# Open Tasks\n- Review Q2 report (high priority, due 2026-05-25)\n\n# Upcoming Meetings\n- Quarterly review (2026-06-01 14:00)\n..."

const messages = [{ role: "system", content: systemPrompt }, ...userMessages];
```

---

### Tier System

**What it does**: Enforce usage quotas and feature gates by tier (free, pro, premium, enterprise).

**How it's built**:

- **Config**: `types/billing.ts` — `PLAN_LIMITS` maps tier → limits
- **Enforcement**: `lib/platform/tiers/enforce.ts` — `enforceTasksMax()`, `enforceMonthlyLimits()`, etc
- **Model**: `UsageCounter` (userId, daily/monthly counters, reset dates)
- **Checks**: Run before writes or expensive operations in API routes + tool handlers
- **Gates**: Tools filtered by `minTier`, features blocked when quota = 0

**Example usage**:

```ts
import { enforceTasksMax, getPlanLimits } from "@/lib/tiers";

// Before creating task
await enforceTasksMax(userId);
// → Throws 403 if current count >= tasksMax for user's tier

// Get limits
const limits = getPlanLimits(user.tier);
// → { tasksMax: 20, messagesPerMonth: 100, ... }
```

---

### i18n (Internationalization)

**What it does**: Localized UI in German (default) + English, middleware-based locale detection.

**How it's built**:

- **Library**: `next-intl` with `messages/de.json` and `messages/en.json`
- **Middleware**: `lib/i18n.ts` — detects locale from URL, headers, or user preferences
- **Usage**: `useTranslations("featureName")` in client components, `getTranslations("featureName")` in server
- **Scope**: All user-facing copy (buttons, labels, placeholders, toasts, empty states, aria-labels), NOT technical logs/errors

**Example usage**:

```tsx
// Client component
import { useTranslations } from "next-intl";
const t = useTranslations("tasks");
<Button>{t("createTask")}</Button>;

// Server page
import { getTranslations } from "next-intl/server";
const t = await getTranslations("tasks");
const title = t("pageTitle");
```

**messages/de.json**:

```json
{
  "tasks": {
    "createTask": "Aufgabe erstellen",
    "pageTitle": "Aufgaben"
  }
}
```

---

### Better Auth

**What it does**: Session-based email/password authentication, user management.

**How it's built**:

- **Library**: `better-auth` with Prisma adapter
- **Config**: `lib/core/auth/index.ts` — auth instance, routes, session settings
- **Models**: `User`, `Session`, `Account`, `Verification`
- **Routes**: `app/api/auth/[...all]/route.ts` — catch-all for auth endpoints
- **Helpers**: `auth.api.getSession({ headers })` for API routes, `auth()` for server pages
- **UI**: `components/auth/` — LoginForm, SignupForm, ForgotPasswordForm

**Example usage**:

```ts
// API route
const session = await auth.api.getSession({ headers: await headers() });
if (!session)
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
const userId = session.user.id;

// Server page
const session = await auth();
if (!session) redirect("/login");
```

---

### Stripe Billing

**What it does**: Subscription billing, tier upgrades, usage tracking, webhooks.

**How it's built**:

- **Server logic**: `lib/platform/stripe/` — checkout, portal, webhook sync, seed products/prices
- **API routes**: `POST /api/stripe/checkout`, `POST /api/stripe/portal`, `POST /api/stripe/webhook`
- **Webhook**: `stripe-webhook` signature verification → sync subscription → update `User.tier` and `stripeCustomerId`
- **Models**: `User.tier`, `User.stripeCustomerId`
- **Products**: `princeps_pro`, `princeps_premium`, `princeps_enterprise` (monthly + yearly prices)

**Example usage**:

```ts
// Create checkout session
POST / api / stripe / checkout;
{
  priceId: "price_pro_monthly";
}
// → Stripe checkout URL → User pays → Webhook updates tier

// Customer portal (manage subscription)
POST / api / stripe / portal;
// → Stripe portal URL → User can cancel, update payment method
```

---

## Quick Patterns

### Adding a New Feature

1. **Data model**: Add to `prisma/schema.prisma` → `npx prisma migrate dev`
2. **Types**: Define API record shape in `types/api.ts`
3. **Server logic**: Create `lib/features/<feature>/schemas.ts`, `create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`, `shared.logic.ts`
4. **API routes**: Create `app/api/<feature>/route.ts` (GET, POST), `[id]/route.ts` (PATCH, DELETE)
5. **UI**: Create `components/<feature>/<Feature>Shell.tsx`, cards, dialogs, `logic/use<Feature>Mutations.ts`
6. **Page**: Create `app/(app)/<feature>/page.tsx`
7. **i18n**: Add strings to `messages/de.json` and `messages/en.json`
8. **Tools** (optional): Create `lib/ai/tools/registry/<feature>.registry.ts`, `handlers/<feature>.handler.ts`, spread into orchestration
9. **Context slot** (optional): Create `lib/ai/context/<feature>.slot.ts`, add to `build.ts`
10. **Tier gate** (optional): Add limits to `types/billing.ts`, enforce in logic/handlers
11. **Docs**: Update `CONTEXT/` and `/docs` as needed

---

### Server-Only Boundaries

**Always use `import "server-only"` at the top of**:

- `lib/features/<feature>/*.logic.ts` (all server logic files)
- `lib/ai/tools/handlers/*.handler.ts`
- `lib/ai/llm-providers/**/*.ts`
- `lib/ai/context/**/*.ts`
- `lib/platform/tiers/enforce.ts`
- Any file importing `@/lib/core/db`, Prisma, Better Auth server helpers, or Node-only APIs

**Never import from client components**:

- `@/lib/core/db`
- Any file with `import "server-only"`
- Prisma client directly

---

### Zod Validation Pattern

```ts
// lib/features/<feature>/schemas.ts
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDate: z.string().datetime().optional(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// API route
const body = (await req.json()) as unknown;
const parsed = createTaskSchema.safeParse(body);
if (!parsed.success)
  return new Response(JSON.stringify({ error: "Invalid input" }), {
    status: 400,
  });
const result = await createTask(userId, parsed.data);
```

---

### Mutation Hook Pattern

```tsx
// components/<feature>/logic/use<Feature>Mutations.ts
export function useTaskMutations(
  setTasks: (tasks: TaskRecord[]) => void,
  strings: { success: string; error: string },
) {
  const [creating, setCreating] = useState(false);

  const createTask = async (input: CreateTaskInput): Promise<boolean> => {
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        toast.error(strings.error);
        return false;
      }
      const { task } = await res.json();
      setTasks((prev) => [...prev, task]);
      toast.success(strings.success);
      return true;
    } finally {
      setCreating(false);
    }
  };

  return { creating, createTask };
}
```

---

### Tier Gate Pattern

```ts
// Before expensive operation
import { enforceTasksMax, getPlanLimits } from "@/lib/tiers";

// Check quota
await enforceTasksMax(userId);
// → Throws 403 if count >= limit

// Monthly quotas
await enforceMonthlyLimits(userId);
// → Throws 403 if messagesPerMonth exceeded

// After LLM call (fire-and-forget)
await accumulateTokens(userId, promptTokens, completionTokens);
```

---

### Tool Definition Pattern

```ts
// lib/ai/tools/registry/<feature>.registry.ts
import type { ToolRegistryEntry } from "../types";

export const taskTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "tasks",
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task for the user. Use when the user requests a task to be created or mentions something they need to do.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short task title, max 200 chars" },
          labelNames: { type: "array", items: { type: "string" }, description: "Optional label names to organize the task" },
        },
        required: ["title"],
      },
    },
  },
];

// lib/ai/tools/handlers/<feature>.handler.ts
import "server-only";
import type { ActionResult } from "../types";
import { createTaskSchema } from "@/lib/features/tasks/schemas";
import { createTask } from "@/lib/tasks";
import { enforceTasksMax } from "@/lib/tiers";
import { resolveOrCreateLabelIdsByNames } from "../resolvers";

export async function create_task(userId: string, args: Record<string, unknown>): Promise<ActionResult> {
  // Resolve names → IDs
  const labelIds = args.labelNames
    ? await resolveOrCreateLabelIdsByNames(userId, args.labelNames as string[])
    : undefined;

  // Validate
  const parsed = createTaskSchema.safeParse({ ...args, labelIds });
  if (!parsed.success) {
    return { ok: false, error: "Invalid task data" };
  }

  // Tier gate
  await enforceTasksMax(userId);

  // Create
  const task = await createTask(userId, parsed.data);
  return { ok: true, data: task };
}

export const taskHandlers = { create_task, list_tasks, update_task, delete_task };

// lib/ai/tools/registry.ts (orchestration)
import { taskTools } from "./registry/tasks.registry";
export const TOOL_REGISTRY: ToolRegistryEntry[] = [...taskTools, ...labelTools, ...];

// lib/ai/tools/executor.ts (orchestration)
import { taskHandlers } from "./handlers/tasks.handler";
const HANDLERS = { ...taskHandlers, ...labelHandlers, ... };
```

---

### Context Slot Pattern

```ts
// lib/ai/context/<feature>.slot.ts
import "server-only";
import { listTasks } from "@/lib/tasks";

export async function buildTasksContext(
  userId: string,
  locale: string,
): Promise<string | null> {
  const tasks = await listTasks(userId);
  const open = tasks.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  );
  if (open.length === 0) return null;

  return `# Open Tasks\n${open.map((t) => `- ${t.title} (${t.priority} priority${t.dueDate ? `, due ${t.dueDate}` : ""})`).join("\n")}`;
}

// lib/ai/context/build.ts
import { buildTasksContext } from "./tasks.slot";

export async function buildContext(
  userId: string,
  locale: string,
): Promise<string> {
  const slots = await Promise.all([
    buildTasksContext(userId, locale),
    buildMeetingsContext(userId, locale),
    // ...
  ]);
  return [BASE_INSTRUCTIONS, ...slots.filter(Boolean)].join("\n\n");
}
```

---

### Daily/Monthly Counter Reset Pattern

```ts
// lib/platform/tiers/enforce.ts
async function getOrCreateCounter(userId: string): Promise<UsageCounter> {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const thisMonth = today.slice(0, 7); // "YYYY-MM"

  let counter = await db.usageCounter.findUnique({ where: { userId } });
  if (!counter) {
    counter = await db.usageCounter.create({ data: { userId } });
  }

  // Reset daily counters if date changed
  if (counter.chatsDailyDate !== today) {
    counter = await db.usageCounter.update({
      where: { userId },
      data: { chatsDailyCount: 0, chatsDailyDate: today },
    });
  }

  // Reset monthly counters if month changed
  if (counter.monthlyResetDate !== thisMonth) {
    counter = await db.usageCounter.update({
      where: { userId },
      data: {
        messageMonthlyCount: 0,
        tokenMonthlyCount: 0,
        toolMonthlyCount: 0,
        monthlyResetDate: thisMonth,
      },
    });
  }

  return counter;
}
```

---

### Cron Route Pattern

```ts
// app/api/cron/<job>/route.ts
import { headers } from "next/headers";

export async function POST(req: Request) {
  const h = await headers();
  const authHeader = h.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Run job
  const result = await runJob();
  return Response.json(result);
}
```

---

### Integration OAuth Flow

```ts
// 1. Connect (start OAuth)
POST /api/integrations/google-calendar/connect
// → Redirect to Google OAuth consent

// 2. Callback (receive code)
GET /api/integrations/google-calendar/callback?code=...
// → Exchange code for tokens → Store in Integration model → Redirect to /settings?tab=integrations

// 3. Sync (fetch external data)
POST /api/integrations/google-calendar/sync
// → Fetch Google Calendar events → Create/update Meeting records → Return summary

// 4. Disconnect
POST /api/integrations/google-calendar/disconnect
// → Delete Integration record → Return success
```

---

## Summary

Princeps is a **full-stack Next.js 15 App Router workspace** with:

- **10 core features**: Tasks, Meetings, Contacts, Decisions, Goals, Labels, Memory, Knowledge, Briefings, Reports
- **AI-powered**: Chat with 40+ tools, context assembly, streaming, voice input
- **Tier system**: Free, Pro, Premium, Enterprise with quota/feature gates
- **Integrations**: Google Calendar, Google Drive, Stripe billing
- **i18n**: German + English
- **Vector search**: pgvector for knowledge retrieval
- **Clean architecture**: Server pages → API routes → server logic, client shells → mutation hooks → API calls

**Key orchestration layers**:

- **LLM providers**: OpenAI, Ollama, Groq abstraction
- **LLM tools**: Registry + handlers + executor for assistant actions
- **Context slots**: System prompt assembly from workspace data
- **Tier gates**: Enforce quotas before writes/expensive ops
- **Notifications**: Daily greetings, overdue nudges, system notices
- **Integrations**: OAuth flows, external data sync

**One pattern to rule them all**:

1. Prisma model
2. Zod schemas
3. Server logic in `lib/features/<feature>/`
4. API routes in `app/api/<feature>/`
5. Client components in `components/<feature>/`
6. i18n strings in `messages/`
7. Tools/context/tier gates as needed

---

**For more details**: See `/CONTEXT` for agent maps, `/docs` for product decisions, and live code for implementation truth.
