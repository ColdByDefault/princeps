# See-Sweet Phase 5 — Chief-of-Staff Layer

## Plan

### Scope

Phase 5 shifts See-Sweet from **reactive** (user asks, assistant answers) to **proactive** (assistant monitors, prepares, and surfaces what matters without being asked). All prior phases supply the data; Phase 5 turns that data into operational leverage.

Phase 4 left three explicit gaps to fill:

- Decision log (stubbed since Phase 1)
- Automated post-meeting action extraction
- Contact interaction history

Phase 5 closes all three and adds the proactive intelligence layer on top.

---

### Guiding Principles

- **No unsupervised writes.** The assistant may propose, but the user always confirms before anything is committed. The only exception is notification creation, which is fire-and-forget.
- **Context slots stay thin.** Slots inject summaries, not full records. Phase 5 slots upgrade existing slots — they never dump more data, they select smarter data.
- **Nudges are opt-out, not opt-in.** They start enabled and are suppressible per category from the settings page.
- **One new model per feature, maximum.** Avoid schema proliferation; prefer extending existing records with new fields.

---

### Feature 1 — Decision Log

Completes the data model stub that has existed since Phase 1. Every major decision the user records gets: rationale, date, outcome, and status. The assistant can reference open decisions, flag stale ones, and avoid repeating closed reasoning.

**Fields:**

| Field       | Type      | Notes                                          |
| ----------- | --------- | ---------------------------------------------- |
| `title`     | string    | Required. Short decision label.                |
| `rationale` | string?   | Why this was decided.                          |
| `outcome`   | string?   | What was decided / what happened.              |
| `status`    | string    | `open`, `decided`, `reversed`. Default `open`. |
| `decidedAt` | DateTime? | When the decision was made.                    |
| `meetingId` | string?   | Optional — where the decision was made.        |

**Prisma model:**

```prisma
model Decision {
  id          String    @id @default(cuid())
  userId      String
  title       String
  rationale   String?
  outcome     String?
  status      String    @default("open") // open | decided | reversed
  decidedAt   DateTime?
  meetingId   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  meeting Meeting? @relation(fields: [meetingId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@map("decision")
}
```

**Behavior:**

- CRUD via `/api/decisions` and `/api/decisions/[id]`.
- `lib/context/decisions.slot.ts` — injects open decisions (all) + recently decided/reversed (last 5).
- Tool call: `create_decision` — so the assistant can log a decision mid-conversation.
- Deduplication guard: same title (case-insensitive) + status `open` → skip + return `{skipped, reason, id}`.
- `/decisions` page + `DecisionForm` / `DecisionList` components, sidebar nav link.

---

### Feature 2 — LLM-Powered Daily Briefing

Replaces the static home snapshot with a full assistant-generated morning brief. Uses all live context slots to produce a prioritized prose narrative: what is urgent today, what to prepare for, what is blocked, what decisions are pending.

**Behavior:**

- `lib/briefing/generate.logic.ts` — assembles all context slots for the user and calls Ollama (non-streaming, structured output).
- `/api/briefing` — GET endpoint; generates a brief, caches it in a `BriefingCache` table (one row per user, overwritten on regeneration, cleared after midnight UTC).
- `BriefingCard` on `/home` renders the LLM text, a "Regenerate" button, and a `generatedAt` timestamp.
- Stale brief (> 12 hours old) shows a soft warning prompting regeneration.

**Prisma model:**

```prisma
model BriefingCache {
  id          String   @id @default(cuid())
  userId      String   @unique
  content     String
  generatedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("briefing_cache")
}
```

---

### Feature 3 — Meeting Prep Pack

Before a meeting, the assistant generates a preparation document: objectives, participant context (from contacts), relevant knowledge chunks, and suggested talking points.

**Behavior:**

- `lib/meetings/prep.logic.ts` — fetches meeting + participants + top-k knowledge chunks relevant to the meeting title; calls Ollama (non-streaming).
- `/api/meetings/[id]/prep` — GET returns existing prep text if available; POST forces regeneration.
- Prep text stored in a new `prepPack` field on the `Meeting` model (nullable string).
- Rendered in the meeting detail / edit view with a "Generate Prep" button.
- Notification triggered when a meeting is within 24 hours and no prep has been generated yet.

**Migration:** add `prepPack String?` to `Meeting`.

---

### Feature 4 — Post-Meeting Capture

User pastes a transcript or raw notes into a meeting → assistant extracts a structured summary, proposed action items, and which contacts were mentioned. User reviews and confirms before anything is written.

**Behavior:**

- `/api/meetings/[id]/capture` — POST `{ rawText: string }` → returns `{ summary: string, tasks: { title, priority, dueDate? }[], contactsFound: string[] }` (no writes yet).
- `lib/meetings/capture.logic.ts` — calls Ollama with the raw text and the meeting's existing participant list.
- Client: capture panel inside the meeting view. Shows proposed tasks as checkboxes and proposed summary as editable textarea. "Confirm" button commits.
- On confirm: PATCH meeting `summary` + bulk POST to `/api/tasks` for each checked task with `meetingId` back-link.
- No autonomous write without user approval.

---

### Feature 5 — Contact Interaction History

Each time a contact is linked to a meeting, has a task created referencing them, or is mentioned in a confirmed capture, a lightweight log entry is recorded. `contacts.slot.ts` is upgraded to include "last interaction" and "open tasks" per injected contact.

**Prisma model:**

```prisma
model ContactInteraction {
  id        String   @id @default(cuid())
  contactId String
  source    String   // "meeting" | "task" | "capture"
  sourceId  String
  createdAt DateTime @default(now())

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@index([contactId])
  @@map("contact_interaction")
}
```

**Behavior:**

- `lib/contacts/log-interaction.ts` — upsert-style helper; called by meeting create/update and capture confirm.
- Contact detail view (expanded card in `ContactList`) shows a timeline of interactions.
- `contacts.slot.ts` upgrade: inject `lastInteraction` date and `openTaskCount` for each injected contact.

---

### Feature 6 — Proactive Nudges

The assistant surfaces items before the user has to ask. Delivered as notifications via the existing Phase 2 SSE infrastructure.

| Trigger                                                 | Notification                                |
| ------------------------------------------------------- | ------------------------------------------- |
| Meeting in < 2 hours, `prepPack` is null                | "Prep pack available for: [meeting title]"  |
| Task overdue by > 1 day, status `open` or `in_progress` | "Overdue: [task title]"                     |
| Decision `open` for > 14 days                           | "Decision pending review: [decision title]" |
| No chat activity in 3 days and open tasks exist         | "You have N open tasks — want a briefing?"  |

**Behavior:**

- `lib/nudges/evaluate.logic.ts` — runs all checks for a given user, deduped by `lastNudgedAt` per trigger key stored in a `NudgeState` column on the `User` preferences JSON (no new model needed).
- `/api/nudges/run` — POST, authenticated, rate-limited to once per authenticated session via a short-lived cookie. Called on layout mount.
- Each fired nudge creates a `Notification` record (`category: nudge_*`, `source: system`) and pushes it via the existing SSE emitter.
- Settings page: per-category nudge on/off toggles stored in `User.preferences`.

---

### Context Slot Registry Updates

| Slot                | Change                                                             |
| ------------------- | ------------------------------------------------------------------ |
| `decisions.slot.ts` | **New** — open decisions (all) + recent decided/reversed (last 5)  |
| `contacts.slot.ts`  | **Upgraded** — adds `lastInteraction`, `openTaskCount` per contact |
| `meetings.slot.ts`  | **Upgraded** — adds `prepReady` flag, surfaces no-prep warning     |

---

### API Routes

**Decisions:**

| Method   | Path                  | Description                         |
| -------- | --------------------- | ----------------------------------- |
| `GET`    | `/api/decisions`      | List all decisions for current user |
| `POST`   | `/api/decisions`      | Create a decision                   |
| `PATCH`  | `/api/decisions/[id]` | Update a decision                   |
| `DELETE` | `/api/decisions/[id]` | Delete a decision                   |

**Briefing:**

| Method | Path            | Description                           |
| ------ | --------------- | ------------------------------------- |
| `GET`  | `/api/briefing` | Return cached brief or generate fresh |
| `POST` | `/api/briefing` | Force regeneration                    |

**Meetings (additions):**

| Method | Path                         | Description                           |
| ------ | ---------------------------- | ------------------------------------- |
| `GET`  | `/api/meetings/[id]/prep`    | Return or generate prep pack          |
| `POST` | `/api/meetings/[id]/prep`    | Force regeneration                    |
| `POST` | `/api/meetings/[id]/capture` | Extract structured data from raw text |

**Nudges:**

| Method | Path              | Description              |
| ------ | ----------------- | ------------------------ |
| `POST` | `/api/nudges/run` | Evaluate and fire nudges |

---

### Lib Layout

```
lib/decisions/
  list.logic.ts
  create.logic.ts
  update.logic.ts
  delete.logic.ts

lib/briefing/
  generate.logic.ts      ← upgraded from static snapshot.ts

lib/meetings/
  prep.logic.ts          ← new
  capture.logic.ts       ← new

lib/contacts/
  log-interaction.ts     ← new

lib/nudges/
  evaluate.logic.ts      ← new

lib/context/
  decisions.slot.ts      ← new
  contacts.slot.ts       ← upgraded
  meetings.slot.ts       ← upgraded
```

---

### UI

```
app/
  decisions/
    page.tsx

components/
  decisions/
    index.ts
    DecisionList.tsx
    DecisionForm.tsx
```

Additions to existing components:

- `MeetingsView` / meeting detail: "Generate Prep" button, prep pack display, capture panel.
- `BriefingCard` on `/home`: LLM brief text, regenerate button, staleness warning.
- `ContactList` expanded card: interaction timeline.
- Settings `/app`: nudge category toggles.

---

### Decisions Made

| #   | Decision                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | `BriefingCache` is a single-row-per-user table. Simpler than Redis for the current scale; easily swappable later. |
| 2   | Meeting prep is stored on the `Meeting` record as `prepPack String?`. No separate model.                          |
| 3   | Post-meeting capture does **not** write automatically. User must confirm.                                         |
| 4   | Nudge state is persisted in `User.preferences` JSON (existing field) to avoid a new model for simple flags.       |
| 5   | `ContactInteraction` is append-only. No edit or delete — it is a factual log.                                     |
| 6   | `create_decision` tool call follows the same deduplication and SSE pattern as the Phase 4 tools.                  |

---

## Done

- **Decision Log** — `Decision` Prisma model, migration `20260329120459_add_decisions`, `lib/decisions/` (list, create, update, delete), `app/api/decisions/` (GET, POST, PATCH, DELETE), `lib/context/decisions.slot.ts` (open decisions + last 5 decided/reversed), `DecisionRecord` in `types/api.ts`, i18n keys `decisions.*` (en + de), `components/decisions/` (DecisionList, DecisionForm, DecisionsView), `app/decisions/page.tsx`, sidebar nav link (`GitFork` icon), `create_decision` tool call in `lib/chat/tools.ts` with deduplication guard.
- **LLM-Powered Daily Briefing** — `BriefingCache` Prisma model + migration `20260329154252_add_briefing_cache`, `lib/briefing/generate.logic.ts` (assembles all context slots, calls Ollama non-streaming, upserts cache), `app/api/briefing/route.ts` (GET: returns cached if < 12h, else generates; POST: force regenerates), `BriefingCard.tsx` upgraded to client component (LLM brief section, Generate/Regenerate button, stale warning > 12h, generatedAt timestamp), `app/home/page.tsx` updated (serialized snapshot, hydrates with cached brief), i18n keys `home.briefing.ai.*` + generate/regenerate/stale/generatedAt (en + de).
- All checks passing: lint ✅ typecheck ✅ build ✅ (40 routes).

## Later

- Recurring meeting templates with auto-generated prep.
- Task dependencies (blocked-by links).
- Delegated team workflows (multi-user).
- Decision change history / audit trail.
- Export briefing as PDF or email.
