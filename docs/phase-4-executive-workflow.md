# See-Sweet Phase 4 — Executive Workflow Layer

## Plan

### Scope

Introduce the first structured workflow features that turn See-Sweet into a genuine operating desk: **Contacts**, **Meetings**, and **Tasks**. Each feature adds a new model, a dedicated route, and a new context slot so the assistant immediately gains awareness of the user's relationships, schedule, and open actions.

All three are designed as a coordinated set. Contacts feed into Meetings (participants). Meetings feed into Tasks (post-meeting action items). Together they give the assistant enough signal to provide coherent, grounded support without requiring a separate AI orchestration layer.

---

### Guiding Principles

- **Data first, then intelligence.** The value of Phase 4 is not clever UI — it is structured, user-owned data that the assistant can reason over. CRUD quality and context slot fidelity matter more than visual polish.
- **Thin context slots.** Each slot injects only what the assistant needs per request — not the full table dump. Recency, relevance, and conciseness are the filters.
- **No autonomous agents yet.** The assistant reads and references this data; it does not write to the database on behalf of the user in an uncontrolled way. Writes happen through declared tool calls (see Assistant-Driven Creation below).
- **One route, one tab.** Each feature gets a dedicated route (`/contacts`, `/meetings`, `/tasks`) mirroring the Knowledge Base pattern: server auth guard, initial data load, client tabs.

---

### Feature 1 — Contacts

A lightweight relationship index. Each contact is a named record with enough fields to give the assistant meaningful context about who the user works with.

**Fields:**

| Field         | Type      | Notes                                     |
| ------------- | --------- | ----------------------------------------- |
| `name`        | string    | Required.                                 |
| `role`        | string?   | Job title or function.                    |
| `company`     | string?   | Organization.                             |
| `email`       | string?   | For display and reference only.           |
| `phone`       | string?   | Optional.                                 |
| `notes`       | string?   | Free-form context notes.                  |
| `tags`        | string[]  | Plain string tags (stored as JSON array). |
| `lastContact` | DateTime? | When the user last interacted with them.  |

**Behavior:**

- Users can create, edit, and delete contacts.
- No duplicate detection in scope — user responsibility.
- `contacts.slot.ts` injects a compact summary (name, role, company, tags) for contacts the user has interacted with recently or that are mentioned in the current conversation.

**Prisma model:**

```prisma
model Contact {
  id          String    @id @default(cuid())
  userId      String
  name        String
  role        String?
  company     String?
  email       String?
  phone       String?
  notes       String?
  tags        Json      @default("[]")
  lastContact DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  meetings  MeetingParticipant[]

  @@index([userId])
  @@map("contact")
}
```

---

### Feature 2 — Meetings

A structured meeting log. Covers past and upcoming meetings, with enough fields to give the assistant prep context and post-meeting capture capability.

**Fields:**

| Field          | Type     | Notes                                          |
| -------------- | -------- | ---------------------------------------------- |
| `title`        | string   | Required.                                      |
| `scheduledAt`  | DateTime | When the meeting is/was.                       |
| `durationMin`  | int?     | Duration in minutes.                           |
| `location`     | string?  | Physical location or video link.               |
| `agenda`       | string?  | Pre-meeting notes, objectives, questions.      |
| `summary`      | string?  | Post-meeting summary (user-written or pasted). |
| `status`       | enum     | `upcoming`, `done`, `cancelled`.               |
| `participants` | relation | Join table linking Meeting ↔ Contact.          |

**Behavior:**

- Users can create, edit, and delete meetings.
- Participants are selected from existing contacts. Ad-hoc name entry (string only) is not in scope — user must create the contact first.
- `meetings.slot.ts` injects: next 3 upcoming meetings (title, time, participants) and the last 2 completed meetings with summaries.

**Prisma models:**

```prisma
model Meeting {
  id           String    @id @default(cuid())
  userId       String
  title        String
  scheduledAt  DateTime
  durationMin  Int?
  location     String?
  agenda       String?
  summary      String?
  status       String    @default("upcoming") // upcoming | done | cancelled
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  participants MeetingParticipant[]

  @@index([userId])
  @@map("meeting")
}

model MeetingParticipant {
  id        String  @id @default(cuid())
  meetingId String
  contactId String

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@unique([meetingId, contactId])
  @@map("meeting_participant")
}
```

---

### Feature 3 — Tasks

A minimal action-tracking layer. Tasks record open items, their priority, status, and due date. They are not a full project management system — the scope is personal, single-user action tracking.

**Fields:**

| Field       | Type      | Notes                                              |
| ----------- | --------- | -------------------------------------------------- |
| `title`     | string    | Required. Short action description.                |
| `notes`     | string?   | Additional context.                                |
| `status`    | enum      | `open`, `in_progress`, `done`, `cancelled`.        |
| `priority`  | enum      | `low`, `normal`, `high`, `urgent`.                 |
| `dueDate`   | DateTime? | Optional deadline.                                 |
| `meetingId` | string?   | Optional link to a meeting (origin of the action). |

**Behavior:**

- Users can create, edit, and delete tasks.
- Status and priority are set manually — no automatic transitions.
- `tasks.slot.ts` injects: all `open` and `in_progress` tasks sorted by priority then due date, capped at 10 items.

**Prisma model:**

```prisma
model Task {
  id        String    @id @default(cuid())
  userId    String
  title     String
  notes     String?
  status    String    @default("open")     // open | in_progress | done | cancelled
  priority  String    @default("normal")  // low | normal | high | urgent
  dueDate   DateTime?
  meetingId String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  meeting Meeting? @relation(fields: [meetingId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@map("task")
}
```

---

### Context Slot Registry (updated)

| Slot             | Source                 | Status        |
| ---------------- | ---------------------- | ------------- |
| Personal Info    | `PersonalInfo.fields`  | ✅ Phase 3    |
| Knowledge chunks | `KnowledgeChunk` + RAG | ✅ Phase 3    |
| Contacts         | `Contact` model        | Phase 4       |
| Meetings         | `Meeting` model        | Phase 4       |
| Tasks            | `Task` model           | Phase 4       |
| Decisions        | `Decision` model       | Stub / future |

New slot files added to `lib/context/`:

```
lib/context/
  contacts.slot.ts
  meetings.slot.ts
  tasks.slot.ts
```

Each registered in `lib/context/index.ts` and ordered after the knowledge slot.

---

### API Routes

**Contacts:**

| Method   | Path                 | Description                            |
| -------- | -------------------- | -------------------------------------- |
| `GET`    | `/api/contacts`      | List all contacts for the current user |
| `POST`   | `/api/contacts`      | Create a contact                       |
| `PATCH`  | `/api/contacts/[id]` | Update a contact                       |
| `DELETE` | `/api/contacts/[id]` | Delete a contact                       |

**Meetings:**

| Method   | Path                 | Description                              |
| -------- | -------------------- | ---------------------------------------- |
| `GET`    | `/api/meetings`      | List all meetings for the current user   |
| `POST`   | `/api/meetings`      | Create a meeting                         |
| `PATCH`  | `/api/meetings/[id]` | Update a meeting (incl. status, summary) |
| `DELETE` | `/api/meetings/[id]` | Delete a meeting                         |

**Tasks:**

| Method   | Path              | Description                            |
| -------- | ----------------- | -------------------------------------- |
| `GET`    | `/api/tasks`      | List tasks for the current user        |
| `POST`   | `/api/tasks`      | Create a task                          |
| `PATCH`  | `/api/tasks/[id]` | Update a task (status, priority, etc.) |
| `DELETE` | `/api/tasks/[id]` | Delete a task                          |

---

### Lib Layout

```
lib/contacts/
  create.logic.ts
  update.logic.ts
  delete.logic.ts
  list.logic.ts

lib/meetings/
  create.logic.ts
  update.logic.ts
  delete.logic.ts
  list.logic.ts

lib/tasks/
  create.logic.ts
  update.logic.ts
  delete.logic.ts
  list.logic.ts
```

---

### UI

Three new top-level routes, each following the Knowledge Base pattern:

```
app/
  contacts/
    page.tsx           ← server: auth guard, initial data, pass to client
  meetings/
    page.tsx
  tasks/
    page.tsx

components/
  contacts/
    index.ts
    ContactList.tsx    ← sortable list with create/edit/delete
    ContactForm.tsx    ← create/edit modal or inline form
  meetings/
    index.ts
    MeetingList.tsx    ← upcoming / past tabs; status badge
    MeetingForm.tsx    ← create/edit with participant picker (from contacts)
  tasks/
    index.ts
    TaskList.tsx       ← grouped by status or sorted by priority + due date
    TaskForm.tsx       ← create/edit with status and priority selectors
```

Navigation links for `/contacts`, `/meetings`, and `/tasks` added to the app sidebar.

---

### Decisions Made

| #   | Decision                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tasks are user-personal only. No assignment to other users in this phase.                                                                      |
| 2   | Meeting participants must be existing contacts. Avoids a separate ad-hoc participant string model.                                             |
| 3   | Status and priority are stored as plain strings, not Postgres enums. Keeps migrations simple and allows future tiers to extend the value sets. |
| 4   | The `meetings.slot.ts` only pulls upcoming/recent meetings. Full history is accessible via the UI, not injected into every prompt.             |
| 5   | Tasks slot caps at 10 items to prevent prompt bloat. Completed and cancelled tasks are excluded from the slot.                                 |

---

## Done

- **Contacts** — `Contact` Prisma model, migration `20260328182309_add_contacts`, `lib/contacts/` (list, create, update, delete), `app/api/contacts/` (GET, POST, PATCH, DELETE), `lib/context/contacts.slot.ts`, `ContactRecord` in `types/api.ts`, i18n keys `contacts.*` (en + de), `components/contacts/` (ContactList, ContactForm), `app/contacts/page.tsx`, sidebar nav link.
- **Meetings** — `Meeting` + `MeetingParticipant` Prisma models, migration `20260329075736_add_meetings`, `lib/meetings/` (list, create, update, delete), `app/api/meetings/` (GET, POST, PATCH, DELETE), `lib/context/meetings.slot.ts` (next 3 upcoming + last 2 done), `MeetingRecord` + `MeetingParticipantRecord` in `types/api.ts`, i18n keys `meetings.*` (en + de), `components/meetings/` (MeetingList, MeetingForm, MeetingsView), `app/meetings/page.tsx`, sidebar nav link.
- **Tasks** — `Task` Prisma model (with optional `meetingId` back-link to Meeting), migration `20260329081923_add_tasks`, `lib/tasks/` (list, create, update, delete), `app/api/tasks/` (GET, POST, PATCH, DELETE), `lib/context/tasks.slot.ts` (open + in_progress, sorted by priority then due date, cap 10), `TaskRecord` in `types/api.ts`, i18n keys `tasks.*` (en + de), `components/tasks/` (TaskList, TaskForm, TasksView), `app/tasks/page.tsx`, sidebar nav link.
- All five context slots registered in `lib/context/index.ts`: `personalInfoSlot`, `knowledgeSlot`, `contactsSlot`, `meetingsSlot`, `tasksSlot`.
- All checks passing: lint ✅ typecheck ✅ build ✅ (32 routes).

### Assistant-Driven Creation (tool calling)

The chat and chat-widget can create contacts, meetings, and tasks on behalf of the user via LLM tool calls. Users have two paths:

1. **Manual** — navigate to `/contacts`, `/meetings`, `/tasks` and create records through the form UI.
2. **Conversational** — ask the assistant (in chat or the floating widget) and it creates the record directly, then confirms inline.

**How it works:**

- `lib/chat/tools.ts` — defines the three tool schemas (`create_contact`, `create_meeting`, `create_task`) and the `executeToolCall` executor that delegates to the existing logic layer.
- `lib/chat/ollama.ts` — extended with `OllamaToolDefinition`, `OllamaToolCallEntry`, and an optional `tools` parameter in `streamOllamaChat`.
- Both stream routes (`/api/chat/[chatId]/stream` and `/api/chat/widget`) now pass `CHAT_TOOLS` to Ollama and run a three-phase loop:
  1. Stream the first response; collect any `tool_calls` from the final done chunk.
  2. Execute each tool call server-side via `executeToolCall`; emit `{ type: "action", name, record }` SSE events.
  3. Send a follow-up request to Ollama with the tool results; stream the conversational reply.
- `ChatWindow` and `ChatWidget` handle the `action` SSE event and render a green confirmation card inline (`✅ Contact created: Jane Doe`).
- i18n keys: `chat.action.created.contact`, `chat.action.created.meeting`, `chat.action.created.task` (en + de).

**Decisions:**

- No tools in the follow-up call to prevent re-entry loops.
- Validation on tool arguments is strict (required fields, date parsing); errors return a JSON error string back to the model as the tool result.
- The widget uses hardcoded English action labels (it has no access to the server-side message bundle).

- Decision log (Phase 5): record decisions with rationale, status, and change history.
- Automated post-meeting action extraction: assistant parses a pasted transcript and proposes tasks.
- Contact interaction history: log when a contact was discussed in chat or linked to a meeting.
- Recurring meetings / standing cadences.
- Task dependencies (blocked-by links).
- Daily briefing digest generated from open tasks + upcoming meetings.
