# Chat Functionality Use Cases and Scenarios

## Introduction

This document outlines the use cases, scenarios, and edge cases for the chat functionality in the See-Sweet application. It covers user journeys for creating, renaming, deleting, and managing chats, message streaming, tool execution, quota enforcement, and system feedback.

Sections are split into **Implemented** (verified in code) and **Not Yet Implemented** (missing or planned).

---

## Implemented

### 1. Chat Creation

- **Normal Flow**:
  - User clicks "New Chat" in the sidebar.
  - `POST /api/chat` is called.
  - Both the daily creation limit (`enforceChatsPerDay`) and the total history cap (`getChatHistoryLimit`) are checked.
  - On success: new chat id is returned (201), stored in `sessionStorage` as `ssweet:pending-empty-chat`, and the user is navigated to `/chat/{chatId}`.
  - **Feedback**: Chat appears in sidebar. Count/limit badge updates.
- **Failure**:
  - Either limit (daily or total) being reached produces the same result: `409 Conflict` → `toast.error(t("sidebar.limitReached"))`.
  - The "New Chat" button becomes visually disabled (`opacity-40`, `pointer-events-none`) when at the total limit.
  - Generic server error → `toast.error(t("error.create"))`.
- **Page Load**:
  - `getOrCreateFirstChat` runs when the user navigates to `/chat` with no chats. It creates one automatically if under limits, or returns null if the limit is hit.

### 2. Chat Deletion

- **Normal Flow**:
  - User opens the chat's dropdown menu and confirms deletion via the `AlertDialog`.
  - `DELETE /api/chat/{chatId}` is called.
  - Ownership is verified server-side; the row is deleted from the DB.
  - **Feedback**: `toast.success(t("sidebar.deleteSuccess"))`. Sidebar list updates optimistically.
  - If the deleted chat was active, the user is redirected to the next available chat, or to `/chat` if none remain.
- **Failure**:
  - Chat not found or not owned by user → `404`. Client shows `toast.error(t("error.delete"))`.

### 3. Chat Rename

- **Normal Flow**:
  - User clicks "Rename" in the chat's dropdown menu and submits a new title.
  - `PATCH /api/chat/{chatId}` is called with `{ title }`.
  - Title is trimmed and capped at 80 characters server-side.
  - **Feedback**: `toast.success(t("sidebar.renameSuccess"))`. Sidebar title updates optimistically.
- **Failure**:
  - Empty or missing title → `400 Bad Request`. No navigation change.
  - Chat not found or not owned → `404`. Client shows `toast.error(t("error.rename"))`.
  - Submitting the same title as the current one → client skips the request silently.

### 4. Chat History / Sidebar

- `GET /api/chat` returns the user's chat list and their `historyLimit` in a single response.
- Sidebar re-fetches on mount and on the `chat:updated` custom DOM event (dispatched after every successful message send).
- A count/limit badge (`{n}/{limit}`) is shown next to the "Chats" label. It turns red when the user is at the limit.
- History is ordered by `updatedAt` descending.

### 5. Empty Chat Handling

- When a new chat is created but no message is sent, its id is stored in `sessionStorage` under `ssweet:pending-empty-chat`.
- **Navigate away**: the sidebar detects the pending key, fires `DELETE /api/chat/{pending}` silently, and removes the chat from the list.
- **Try to create another chat while one is pending**: `toast(t("sidebar.pendingEmpty"))` is shown; no new chat is created.
- Empty chats are never explicitly "saved" — the pending key is cleared when the first message is sent successfully (via the `chat:updated` event handler).

### 6. Message Streaming (`POST /api/chat/{chatId}/stream`)

- **Auth**: session required → `401` if missing.
- **Rate limiting**: in-memory per-user/IP limiter (`chatRateLimiter`). Exceeding the window → `429` with `Retry-After` header.
- **Input validation**: empty or non-string message body → `400`.
- **Ownership check**: chat must belong to the requesting user → `404` if not found.
- **Monthly quota gate** (`enforceMonthlyLimits`): checks both monthly message count and monthly token budget before touching the LLM. Either limit exceeded → `429` with a specific reason string, shown via `toast.error(reason)` on the client.
- **Auto-title**: on the first message in a chat, the title is set to the first 60 characters of the user's message.
- **Streaming**: response is `text/event-stream`. SSE event types:
  - `{ type: "token", text: "…" }` — partial LLM output, appended to the assistant bubble in real time.
  - `{ type: "action", name: "…", record: {…} }` — emitted after each tool call executes.
  - `{ type: "done" }` — stream finished; assistant message is finalized in state.
  - `{ type: "error", message: "…" }` — stream-level error; assistant placeholder is removed and `toast.error` is shown.
- **Message history cap**: only the last 40 messages are loaded and sent to the LLM per request.
- **Token accumulation**: after the response completes, `accumulateTokens` increments the monthly token counter fire-and-forget (1 token ≈ 4 characters).

### 7. Tool Call Execution

- Tool calls are detected in the first LLM streaming pass and collected.
- Before executing, `enforceToolCallsMonthly` checks the monthly tool call budget. If exceeded → SSE `error` event with the reason string.
- Each tool call is executed via `executeToolCall`, and a `{ type: "action" }` SSE event is emitted with the result.
- A second LLM pass (without tools, to prevent loops) generates the final text response using the tool results.

### 8. Monthly Quota Enforcement

Three separate monthly counters are enforced, all with automatic reset at the start of a new month:

| Counter                | Limit source               | Enforced by               |
| ---------------------- | -------------------------- | ------------------------- |
| Messages per month     | `limits.messagesPerMonth`  | `enforceMonthlyLimits`    |
| Token budget per month | `limits.tokensPerMonth`    | `enforceMonthlyLimits`    |
| Tool calls per month   | `limits.toolCallsPerMonth` | `enforceToolCallsMonthly` |

All three return a specific `reason` string on failure, which the client surfaces directly in the toast.

### 9. Authentication / Protected Routes

- All API routes check for a valid session via `auth.api.getSession`. Missing session → `401 Unauthorized`.
- The `/chat` page is behind the app layout's auth guard; unauthenticated users are redirected to `/login`.

---

## Not Yet Implemented

### 1. Rate Limiting — Production Grade

- The current `InMemoryRateLimiter` in `lib/security.ts` is single-node only. It does not work correctly in multi-instance or serverless deployments (limits are per-node, not global). A distributed limiter backed by Redis or Upstash is needed for production.

### 2. Streaming Abort / Cancel

- There is no way for the user to cancel an in-flight stream. The send button is disabled during streaming, but no abort signal is sent to the server. A `stop` button wired to `AbortController` is not implemented.

### 3. Message Editing / Regeneration

- Users cannot edit a sent message or regenerate the last assistant response.

---

## HTTP Response Reference

| Route                   | Method | Status | Meaning                              |
| ----------------------- | ------ | ------ | ------------------------------------ |
| `/api/chat`             | GET    | 401    | Not authenticated                    |
| `/api/chat`             | POST   | 201    | Chat created                         |
| `/api/chat`             | POST   | 409    | Daily or total chat limit reached    |
| `/api/chat`             | POST   | 500    | Unexpected server error              |
| `/api/chat/{id}`        | DELETE | 200    | Deleted                              |
| `/api/chat/{id}`        | DELETE | 401    | Not authenticated                    |
| `/api/chat/{id}`        | DELETE | 404    | Not found or wrong owner             |
| `/api/chat/{id}`        | PATCH  | 200    | Renamed                              |
| `/api/chat/{id}`        | PATCH  | 400    | Invalid title                        |
| `/api/chat/{id}`        | PATCH  | 404    | Not found or wrong owner             |
| `/api/chat/{id}/stream` | POST   | 400    | Empty/invalid message                |
| `/api/chat/{id}/stream` | POST   | 401    | Not authenticated                    |
| `/api/chat/{id}/stream` | POST   | 404    | Chat not found or wrong owner        |
| `/api/chat/{id}/stream` | POST   | 429    | Rate limit or monthly quota exceeded |
