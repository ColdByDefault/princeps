# Memory Feature

> **Status:** Implemented — April 2026
> **Branch:** `feat/new-tool-memory`

Memory is a persistent, user-scoped fact store. The LLM can read and write facts via tool calls, and users can manage entries manually at `/memory`. All entries are injected into the LLM system prompt on every request.

---

## Overview

- Each **memory entry** has a `key` (short topic label) and a `value` (freeform fact).
- `source` tracks who created the entry: `llm` or `user`.
- Entries are shown in the UI with a badge ("AI" or "You") to indicate origin.
- The LLM reads all entries on every request via the context slot — no explicit recall needed unless the LLM wants to check IDs.
- LLM-created entries consume `toolCallsPerMonth` as normal. UI-created entries only count against the at-rest `memoryMax` cap.

---

## Data Model — `prisma/schema.prisma`

```prisma
enum MemorySource {
  llm
  user
}

model MemoryEntry {
  id        String       @id @default(cuid())
  userId    String
  key       String       // brief topic label, e.g. "job title"
  value     String       // freeform fact content
  source    MemorySource @default(user)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("memory_entry")
}
```

`User` has a `memoryEntries MemoryEntry[]` relation.

---

## Tier Enforcement

`memoryMax` was added to `PlanLimits` in `types/billing.ts`:

| Tier       | `memoryMax`    |
| ---------- | -------------- |
| free       | 25             |
| pro        | 100            |
| premium    | 500            |
| enterprise | −1 (unlimited) |

`enforceMemoryMax(userId)` in `lib/tiers/enforce.ts` follows the same count-at-rest pattern as `enforceTasksMax` — it counts existing rows and blocks creation when the limit is reached. No counter is incremented; the row count in the DB is always the source of truth.

---

## Server Logic — `lib/memory/`

All files start with `import "server-only"`.

| File              | Responsibility                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `schemas.ts`      | Zod validators — `createMemoryEntrySchema` (key + value), `updateMemoryEntrySchema` (both optional) |
| `shared.logic.ts` | `MEMORY_ENTRY_SELECT` const + `toMemoryEntryRecord()` mapper                                        |
| `create.logic.ts` | `createMemoryEntry(userId, data, source)` — source defaults to `"user"`                             |
| `list.logic.ts`   | `listMemoryEntries(userId)` — ordered by `updatedAt desc`                                           |
| `update.logic.ts` | `updateMemoryEntry(userId, id, data)` — single round-trip, `.catch(() => null)` for not-found       |
| `delete.logic.ts` | `deleteMemoryEntry(userId, id)` — `deleteMany` returns count; 0 = not found                         |

---

## API Routes — `app/api/memory/`

### `route.ts`

| Method | Auth | Rate limit         | Tier gate          | Action                             |
| ------ | ---- | ------------------ | ------------------ | ---------------------------------- |
| `GET`  | ✅   | —                  | —                  | List all entries for the user      |
| `POST` | ✅   | `writeRateLimiter` | `enforceMemoryMax` | Create entry with `source: "user"` |

Response shapes: `{ entries }` / `{ entry }`.

### `[id]/route.ts`

| Method   | Auth | Rate limit         | Action                                         |
| -------- | ---- | ------------------ | ---------------------------------------------- |
| `PATCH`  | ✅   | `writeRateLimiter` | Update key and/or value                        |
| `DELETE` | ✅   | `writeRateLimiter` | Delete entry; 204 on success, 404 if not found |

---

## LLM Tool Layer

### `lib/tools/handlers/memory.handler.ts`

Three handlers, all exported as `memoryHandlers`:

| Tool name       | Handler              | Notes                                                               |
| --------------- | -------------------- | ------------------------------------------------------------------- |
| `remember_fact` | `handleRememberFact` | Tier-gated. Creates entry with `source: "llm"`.                     |
| `recall_facts`  | `handleRecallFacts`  | Lists all entries. Returns `{ entries }`.                           |
| `forget_fact`   | `handleForgetFact`   | Deletes by `id`. LLM must call `recall_facts` first to find the ID. |

### `lib/tools/registry.ts`

Three tool definitions added, all at `minTier: "free"`, group `"memory"`:

```
remember_fact  — required: key, value
recall_facts   — no parameters
forget_fact    — required: id
```

### `lib/tools/executor.ts`

`memoryHandlers` spread into the `HANDLERS` map. No other changes needed to `executor.ts`.

---

## LLM Context Slot — `lib/context/memory.slot.ts`

Injects all memory entries into the system prompt under the label **"Long-Term Memory"**:

```
- [<id>] <key>: <value>
- [<id>] <key>: <value>
```

The `id` is included so the LLM can call `forget_fact` with a specific ID. Returns `null` (slot omitted) when there are no entries. Registered in `lib/context/index.ts` → `SLOT_REGISTRY`.

---

## UI — `components/memory/`

| File                          | Role                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `logic/useMemoryMutations.ts` | Create / update / delete with loading state and `sonner` toasts                                                           |
| `MemoryEntryCard.tsx`         | Displays key, value, source badge (AI / You), dropdown with edit + delete                                                 |
| `CreateMemoryEntryDialog.tsx` | Dialog — key + value inputs, uses `render={...}` on `DialogTrigger`                                                       |
| `EditMemoryEntryDialog.tsx`   | Dialog — inner `EditForm` component initialized from props via `key` prop (avoids the `useEffect` + `setState` lint rule) |
| `MemoryShell.tsx`             | Full page: header (refresh + add button), entry list, empty state, edit dialog, delete `AlertDialog`                      |
| `index.ts`                    | Barrel exports                                                                                                            |

### Source badge colors

- `llm` → violet (`border-violet-200 bg-violet-50 text-violet-700`)
- `user` → neutral muted

---

## Server Page — `app/(app)/memory/page.tsx`

- Auth guard — redirects to `/login` if no session.
- Fetches `listMemoryEntries` server-side, passes initial data to `MemoryShell`.
- `generateMetadata` uses `defineSEO` with `memory.metadata.*` i18n keys.

---

## i18n

Full `memory` namespace in both `messages/de.json` and `messages/en.json`. Key groups:

| Key group                                                      | Contents                             |
| -------------------------------------------------------------- | ------------------------------------ |
| `metadata.*`                                                   | Page title + description for SEO     |
| `pageTitle`, `pageSubtitle`                                    | Shell header                         |
| `addEntry`, `refresh`, `empty`, `emptyHint`                    | Shell UI                             |
| `sourceAI`, `sourceUser`                                       | Card source badge labels             |
| `actions`, `edit`, `delete`, `cancel`, `save`, `saving`        | Common actions                       |
| `keyLabel`, `keyPlaceholder`, `valueLabel`, `valuePlaceholder` | Form fields                          |
| `createTitle`, `editTitle`                                     | Dialog titles                        |
| `createDialog.*`, `editDialog.*`, `deleteDialog.*`             | Toast messages + confirm dialog text |
