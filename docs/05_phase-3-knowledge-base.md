# See-Sweet Phase 3 — Knowledge Base

## Plan

### Goal

Give each user a private knowledge layer they control: a document store for text/markdown files (chunked for retrieval) and a structured personal-info record. Both feed directly into the LLM's system prompt via a formal **context slot registry** that makes every future data source trivially injectable.

---

### The Context Slot Registry (architectural keystone)

Right now `context.logic.ts` assembles the system prompt imperatively — each new feature will have to be wired in by hand. Instead, introduce a dedicated top-level registry at `lib/context/`. Chat is **only a consumer** of this registry; the registry is not owned by or nested under chat.

```
lib/context/
  index.ts              ← barrel; exports ordered SLOT_REGISTRY array
  build.ts              ← assembles the full system prompt from all slots
  personal-info.slot.ts ← fetches PersonalInfo and formats it
  knowledge.slot.ts     ← runs vector search, injects top-k chunks
  # future:
  meetings.slot.ts
  contacts.slot.ts
  tasks.slot.ts
  decisions.slot.ts
```

Each slot file exports a single object conforming to:

```ts
export interface ContextSlot {
  key: string; // machine label, used in logs / debug headers
  label: string; // section heading injected into the prompt
  fetch: (userId: string, query: string) => Promise<string | null>;
  // returns null → section is omitted entirely (no empty headers)
}
```

`lib/context/build.ts` owns the full prompt assembly (absorbing the logic currently in `lib/chat/context.logic.ts`). It iterates the registry in order, awaits each slot, and appends non-null results as labeled sections. `lib/chat/` calls `buildSystemPrompt` from `lib/context/build.ts` — it has no knowledge of what slots exist.

Adding a new feature = creating one slot file and adding it to `lib/context/index.ts`. Nothing else changes.

---

### Feature 1 — Knowledge Base (document upload)

Users upload `.txt` or `.md` files only. **The file itself is never stored anywhere** — not on disk, not in object storage, not in the database. Only the extracted chunks and their embeddings are persisted. The pipeline is:

```
Upload → parse text → chunk (≈ 500 tokens, 50 token overlap)
       → embed each chunk via Ollama embed endpoint
       → store chunks + embeddings in PostgreSQL (pgvector)
```

On every chat request, `knowledge.slot.ts` embeds the latest user message and runs a cosine-similarity search against that user's chunks, injecting the top-k results.

**Per-upload size cap:** 1 MB of raw text. Enforced server-side before chunking; returns `400` if exceeded.

**Quota limits** (fields already exist on `User`; tiers are configured in a later phase):

| Field                  | Free tier | Pro tier |
| ---------------------- | --------- | -------- |
| `knowledgeUploadsUsed` | 5 files   | 50 files |
| `knowledgeCharsUsed`   | 50 000    | 500 000  |

When the size cap or either quota is hit, the upload is rejected (`400` / `429`). Tier caps will be externalized to a config in the tier management phase.

---

### Feature 2 — Personal Info

A single JSON record per user. No file upload — users fill a form with typed fields:

| Field     | Type   | Example              |
| --------- | ------ | -------------------- |
| Full name | string | Jane Doe             |
| Age       | number | 34                   |
| Job title | string | VP of Engineering    |
| Company   | string | Acme Corp            |
| Location  | string | Berlin, Germany      |
| Bio       | string | Free-form short note |

Additional custom fields can be added as `key: value` pairs (a simple "add field" row). Stored as `Json` in Postgres — no schema migration needed to add field types.

`personal-info.slot.ts` formats the record as a concise bullet list and injects it near the top of the system prompt.

---

### Prisma Schema Additions

```prisma
// ─── Knowledge Base ────────────────────────────────────────

model KnowledgeDocument {
  id        String   @id @default(cuid())
  userId    String
  name      String   // original filename (display only)
  charCount Int      // total chars contributed to quota
  createdAt DateTime @default(now())

  user   User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  chunks KnowledgeChunk[]

  @@index([userId])
  @@map("knowledge_document")
}

model KnowledgeChunk {
  id         String                      @id @default(cuid())
  documentId String
  userId     String
  content    String
  embedding  Unsupported("vector(4096)")?
  chunkIndex Int
  createdAt  DateTime                    @default(now())

  document KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("knowledge_chunk")
}

// ─── Personal Info ─────────────────────────────────────────

model PersonalInfo {
  id        String   @id @default(cuid())
  userId    String   @unique
  fields    Json     @default("{}")
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("personal_info")
}
```

Vector index (raw SQL in a migration):

```sql
CREATE INDEX knowledge_chunk_embedding_idx
  ON knowledge_chunk USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

### API Routes

| Method | Path                            | Description                                        |
| ------ | ------------------------------- | -------------------------------------------------- |
| GET    | `/api/knowledge/documents`      | List all documents for the current user            |
| POST   | `/api/knowledge/documents`      | Upload a file → chunk → embed → persist            |
| DELETE | `/api/knowledge/documents/[id]` | Delete document + cascade chunks + decrement quota |
| GET    | `/api/knowledge/personal-info`  | Return the user's personal-info record             |
| PATCH  | `/api/knowledge/personal-info`  | Upsert the fields JSON                             |

---

### Lib Layout

```
lib/knowledge/
  upload.logic.ts        ← orchestrate: validate → chunk → embed → store → update quota
  chunk.logic.ts         ← split text into ≈500-token chunks with overlap
  embed.logic.ts         ← call Ollama /api/embed using EMBEDDING_MODEL env var, return float[]
  search.logic.ts        ← pgvector cosine search, returns top-k KnowledgeChunk rows
  delete.logic.ts        ← delete document + reclaim quota from User
  personal-info.logic.ts ← upsert and read PersonalInfo
  list.logic.ts          ← list documents for a user

lib/context/
  index.ts               ← SLOT_REGISTRY: [personalInfoSlot, knowledgeSlot, ...]
  build.ts               ← buildSystemPrompt(); replaces lib/chat/context.logic.ts
  personal-info.slot.ts
  knowledge.slot.ts
```

---

### UI

Route: `app/knowledge/page.tsx` — two tabs rendered client-side.

```
app/
  knowledge/
    page.tsx            ← server: auth check, pass initial data

components/
  knowledge/
    index.ts
    KnowledgeTabs.tsx   ← client: tab switcher (Knowledge Base | Personal Info)
    DocumentList.tsx    ← client: uploaded doc cards, delete button
    DocumentUpload.tsx  ← client: drag/drop or file picker (.txt, .md only), progress
    PersonalInfoForm.tsx ← client: typed fields + custom key-value rows, save button
```

---

### LLM Context Assembly (updated slot table)

| Slot             | Source                 | Status        |
| ---------------- | ---------------------- | ------------- |
| Personal Info    | `PersonalInfo.fields`  | Phase 3       |
| Knowledge chunks | `KnowledgeChunk` + RAG | Phase 3       |
| Meetings         | `Meeting` model        | Stub / future |
| Contacts         | `Contact` model        | Stub / future |
| Tasks            | `Task` model           | Stub / future |
| Decisions        | `Decision` model       | Stub / future |

---

### Decisions Made

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Embedding model read from `OLLAMA_EMBED_MODEL` env var. Configured as `qwen3-embedding:8b` (4096 dims). pgvector index types cap at 2000 dims (vector) and 4000 dims (halfvec HNSW) — both are below 4096. Sequential scan (`<=>`) is used instead; it is sufficient at free-tier scale (≤5 documents). If a ≤2000-dim model is switched to later, add an HNSW index at that point. |
| 2   | Top-k defaults to **5** chunks per chat request. Configurable per user in a future settings update.                                                                                                                                                                                                                                                                                 |
| 3   | Uploaded files are never stored. Only chunks are persisted. No file-level deletion concept — deleting a `KnowledgeDocument` cascades to its chunks.                                                                                                                                                                                                                                 |
| 4   | Per-upload raw text size cap: **1 MB**, enforced before chunking. Tier quota caps managed in the tier phase.                                                                                                                                                                                                                                                                        |

---

## Done

- Prisma `KnowledgeDocument`, `KnowledgeChunk`, and `PersonalInfo` models added and migrated.
- `lib/knowledge/` — `upload.logic.ts`, `chunk.logic.ts`, `embed.logic.ts`, `search.logic.ts`, `delete.logic.ts`, `personal-info.logic.ts`, `list.logic.ts`.
- API routes: `GET/POST /api/knowledge/documents`, `DELETE /api/knowledge/documents/[id]`, `GET/PATCH /api/knowledge/personal-info`.
- Upload pipeline: validate type + size cap (1 MB) → chunk (~500 tokens, 50-token overlap) → embed via Ollama → store in pgvector. Quota (`knowledgeUploadsUsed`, `knowledgeCharsUsed`) recalculated on upload and delete.
- `lib/context/` slot registry introduced: `index.ts`, `build.ts`, `personal-info.slot.ts`, `knowledge.slot.ts`. `buildSystemPrompt` replaces the old `lib/chat/context.logic.ts`.
- `app/knowledge/page.tsx` — server auth guard, passes initial documents and personal-info to client.
- `components/knowledge/` — `KnowledgeTabs.tsx`, `DocumentList.tsx` (includes upload UI), `PersonalInfoForm.tsx`, `index.ts`.
- i18n keys added to `en.json` and `de.json` under `knowledge.*`.
- Lint, typecheck, and build pass clean.

## Later

- Stream upload progress for large files.
- Preview extracted chunks before confirming upload.
- Let users tag/group documents by topic.
- Re-embed all chunks when the embedding model changes.
