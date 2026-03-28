# See-Sweet Phase 1 — Chat

## Plan

### Scope

Build the `/chat` feature: a fully functional, retrieval-aware assistant chat backed by a local Ollama instance running `qwen3.5:4b`.

The chat must feel like a private executive secretariat — not a generic chatbot. The LLM receives a rich system prompt assembled server-side that is dynamically composed from all user-scoped data available at the time of the request. As new features (meetings, contacts, tasks, decisions, knowledge base) are added to the product, their data is automatically included in that prompt assembly.

---

### Feature Boundaries

#### Chat Management

- Each user can have up to **10 saved chats**.
- Chats are persisted in PostgreSQL (new `Chat` and `ChatMessage` Prisma models).
- Chats can be **switched between** via a history sidebar in the `/chat` layout.
- Chats have a title (auto-generated from the first user message, truncated) and a `createdAt` timestamp.
- When the limit is hit: **block new chat creation** and prompt the user to delete one manually (no silent auto-delete).
- Chats can be **renamed** and **deleted** with confirmation.

#### Chat UI

- Route: `app/chat/` with a nested `[chatId]` layout for per-chat views.
- Left sidebar: conversation history list (collapsible on mobile), new chat button, per-chat rename/delete.
- Main area: message thread with user and assistant bubbles, input bar, controls.
- Input bar controls:
  - Text input (multi-line, auto-grow).
  - Send button.
  - **Thinking toggle** — maps to Ollama `enable_thinking`. When ON, the `<think>…</think>` block is rendered in a collapsible "Reasoning" section above the final answer. The toggle state persists in `localStorage` (global preference, not per-chat).
- Messages stream token-by-token via a server-sent event or `ReadableStream` route.

#### Thinking Mode

- Ollama Qwen3 supports `think: true/false` at the top level of the API request.
- When enabled, the model emits thinking content in `message.thinking` of each streaming chunk.
- The UI shows a **pulsing shadcn `Progress` bar** while thinking chunks are arriving.
- Once regular `message.content` chunks begin, the progress bar is dismissed and the streamed answer renders.
- The raw thinking content is **never displayed** to the user.
- Toggle state persists in `localStorage` (global preference, not per-chat).
- Thinking content is saved in `ChatMessage.thinking` for auditability only.
- When toggle is OFF, `think: false` is passed and the model responds directly.

#### LLM Context Assembly (Server-Side)

The system prompt is assembled in `lib/chat/context.logic.ts` and grows as features are added:

| Slot                                       | Source                     | Status                            |
| ------------------------------------------ | -------------------------- | --------------------------------- |
| User profile (name, timezone, preferences) | `User` model               | ✅ Ready                          |
| Assistant behavior config                  | `User.preferences` JSON    | ✅ Wire at start                  |
| Meetings & agenda                          | `Meeting` model            | 🔲 Stub (empty when table absent) |
| Contacts                                   | `Contact` model            | 🔲 Stub                           |
| Active tasks                               | `Task` model               | 🔲 Stub                           |
| Decisions                                  | `Decision` model           | 🔲 Stub                           |
| Knowledge base chunks (RAG)                | `DocumentChunk` + pgvector | 🔲 Stub                           |
| Conversation history (last N turns)        | `ChatMessage` model        | ✅ In scope                       |

Each slot is independently fetched and injected; missing features simply contribute an empty section. No slot causes a startup failure.

#### API Routes

- `POST /api/chat` — send a message (returns a streaming response).
- `GET /api/chat` — list all chats for the current user.
- `POST /api/chat/new` — create a new chat (enforces 10-chat limit).
- `DELETE /api/chat/[chatId]` — delete a chat (with message cascade).
- `PATCH /api/chat/[chatId]` — rename a chat.
- `GET /api/chat/[chatId]/messages` — fetch message history for a chat.

#### Prisma Schema Additions

```prisma
model Chat {
  id        String   @id @default(cuid())
  userId    String
  title     String   @default("New chat")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages ChatMessage[]

  @@map("chat")
}

model ChatMessage {
  id        String   @id @default(cuid())
  chatId    String
  role      String   // "user" | "assistant"
  content   String
  thinking  String?  // raw <think>...</think> content when thinking mode was on
  createdAt DateTime @default(now())

  chat Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)

  @@map("chat_message")
}
```

---

### File Layout

```
app/
  chat/
    layout.tsx          ← server: auth check, load chats sidebar data
    page.tsx            ← redirect to last active chat or new
    [chatId]/
      page.tsx          ← server: load chat messages, pass to client
components/
  chat/
    index.ts
    ChatShell.tsx       ← client: outer layout (sidebar + main, responsive)
    ChatSidebar.tsx     ← client: chat list, new chat btn, rename/delete
    ChatThread.tsx      ← client: message list, auto-scroll
    ChatMessage.tsx     ← client: single message bubble (user / assistant + thinking block)
    ChatInput.tsx       ← client: textarea, send btn, thinking toggle
    ThinkingBlock.tsx   ← client: collapsible reasoning display
lib/
  chat/
    context.logic.ts    ← server: assemble system prompt from user data
    list.logic.ts       ← server: list chats for user
    create.logic.ts     ← server: create chat, enforce limit
    delete.logic.ts     ← server: delete chat
    update.logic.ts     ← server: rename chat
    messages.logic.ts   ← server: fetch and persist messages
    ollama.ts           ← server: Ollama streaming client wrapper
```

---

### Ollama Integration

- Base URL: `http://localhost:11434` (env: `OLLAMA_BASE_URL`).
- Model: `qwen3.5:4b` (env: `OLLAMA_MODEL`, default `qwen3.5:4b` — note: actual Ollama name may be `qwen3:4b`; confirm at runtime).
- Uses the Ollama `/api/chat` endpoint with `stream: true`.
- `enable_thinking` passed in `options` when the toggle is on.
- The route handler pipes the Ollama stream directly into a `ReadableStream` response; no buffering of full responses.

---

### i18n

All user-visible strings go through the `messages/` system. Keys will be added under the `chat.*` namespace.

---

## Done

- All API routes (`/api/chat`, `/api/chat/[chatId]`, `/api/chat/[chatId]/stream`) implemented and functional.
- Prisma `Chat` + `ChatMessage` models migrated.
- Streaming SSE pipeline: Ollama → server `ReadableStream` → client token-by-token render.
- Thinking mode toggle (localStorage, `useSyncExternalStore`); progress bar while thinking.
- Auto-title from first user message; rename + delete with confirm dialog.
- 10-chat limit enforced server-side and surfaced in sidebar.
- `app/chat/layout.tsx` repurposed as auth guard + full-height flex container.
- `getOrCreateFirstChat` moved to `lib/chat/create.logic.ts`.
- Root layout changed to `h-svh` + `min-h-0` chain so chat fills precisely between navbar and footer.
- ChatShell redesigned: sidebar + divider + main column with chat-title header.
- ChatSidebar: active indicator dot, tighter active style, improved rename input.
- System prompt rewritten: concise, exec-first, date-aware, no stubs; instructs model to avoid clarifying questions and not draft emails unless asked.
- Streaming `done` event now breaks the outer `while` loop (prevents any post-done read cycle).
- `think` toggle persisted to `localStorage` via `useSyncExternalStore` + custom `ssweet:think-changed` event (no hydration mismatch).
- Thinking phase renders an indeterminate `Progress` bar instead of bouncing dots.
- Resolved assistant messages show a "Model reasoned" chip when thinking was used (option b — no raw content exposed).
- `chat.error.load` wired to sidebar `fetchChats` catch block (shows a toast on network failure).
- Site header is `sticky top-0 z-10` — stays visible while scrolling through messages.
- Settings dialog is global (user-scoped preferences, not per-chat) — kept as-is.
- Success toasts on chat delete and rename.

## Later

- Pin important chats above the 10-chat limit.
