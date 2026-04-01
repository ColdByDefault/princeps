<!--
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
-->

# Tier Enforcement — Audit & Reference

This document is the single source of truth for plan-limit enforcement across See-Sweet.
It covers what is actually enforced today, what is not, and what still needs to be built.

---

## Plan Limits (canonical)

Defined in [`types/billing.ts`](../types/billing.ts) and enforced via [`lib/billing/enforce.logic.ts`](../lib/billing/enforce.logic.ts).

| Resource                           | `free` | `pro` | `premium` |
| ---------------------------------- | ------ | ----- | --------- |
| Knowledge documents (total stored) | 3      | 25    | 50        |
| Chat history visible at once       | 10     | 20    | 50        |
| New chats created per calendar day | 10     | 30    | 100       |
| Widget chat messages per day       | 30     | 60    | 120       |
| Widget tool calls per day          | 5      | 25    | 50        |
| Proactive nudges                   | Off    | On    | On        |

Row-count limits for meetings, tasks, contacts, and decisions are **not defined** in the spec — those resources are currently unlimited for all tiers.

---

## Enforcement Status

### ✅ Fully enforced

| Feature                   | Enforcement point               | How                                                                                                                    |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Knowledge doc count       | `lib/knowledge/upload.logic.ts` | `assertWithinPlan(userId, "knowledge_docs")` before DB insert; `knowledgeUploadsUsed` incremented on success           |
| Chat history total        | `lib/chat/create.logic.ts`      | Live `db.chat.count()` vs `getPlanLimits(tier).chatHistoryTotal`                                                       |
| Chats per day             | `lib/chat/create.logic.ts`      | `assertWithinPlan(userId, "chat_daily")` + `incrementChatDailyCounter()` after success; counter resets at UTC midnight |
| Widget chats per day      | `app/api/chat/widget/route.ts`  | `checkAndConsumeWidgetChat()` checks + increments atomically before streaming                                          |
| Widget tool calls per day | `app/api/chat/widget/route.ts`  | `incrementWidgetToolCounter()` trims allowed tool list to remaining quota; 0 remaining → plain-text fallback           |
| Proactive nudges          | `lib/nudges/evaluate.logic.ts`  | Early `return` for `free` tier — evaluation loop never runs                                                            |

### ⚠️ Partially enforced (rate limiter only, not tier-aware)

| Feature                                                       | Current protection                                        | Gap                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Manual briefing regeneration (`POST /api/briefing`)           | `briefingRateLimiter` — 5 requests/hour for **all** tiers | No tier-based daily or monthly LLM call budget                                                            |
| Meeting prep pack generation (`POST /api/meetings/[id]/prep`) | `prepRateLimiter` — 10 requests/hour for **all** tiers    | Same — flat rate limit regardless of tier                                                                 |
| Chat stream LLM messages (`POST /api/chat/[chatId]/stream`)   | `chatRateLimiter` — 30 messages/60 s for **all** tiers    | Once inside a chat, LLM calls and tool executions are unlimited per-tier; only the burst window is capped |

### ❌ Not enforced

| Feature                                                                          | Path                                                    | Notes                                                                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Meetings created via UI                                                          | `POST /api/meetings` → `lib/meetings/create.logic.ts`   | No row-count limit; no tier check                                                                                               |
| Meetings created via chat tool                                                   | `lib/chat/tools/` → `createMeeting`                     | Inherits `create.logic.ts` — same gap                                                                                           |
| Tasks created via UI                                                             | `POST /api/tasks` → `lib/tasks/create.logic.ts`         | No row-count limit; no tier check                                                                                               |
| Tasks created via chat tool                                                      | Same as above                                           | Same gap                                                                                                                        |
| Contacts created via UI                                                          | `POST /api/contacts` → `lib/contacts/create.logic.ts`   | No row-count limit; no tier check                                                                                               |
| Contacts created via chat tool                                                   | Same as above                                           | Same gap                                                                                                                        |
| Decisions created via UI                                                         | `POST /api/decisions` → `lib/decisions/create.logic.ts` | No row-count limit; no tier check                                                                                               |
| Decisions created via chat tool                                                  | Same as above                                           | Same gap                                                                                                                        |
| Cron briefing job (`lib/cron/briefing.logic.ts`)                                 | Runs for **all** users regardless of tier               | Currently gated by user preference (`briefing === "off"`) only, not by tier                                                     |
| AI report generation (`lib/reports/generate.logic.ts`)                           | Fire-and-forget after every chat tool batch             | No tier check; triggered implicitly by any tool execution; no storage limit on reports table                                    |
| Main chat tool executions (create/update/delete via AI)                          | Only the chat creation itself is tier-checked           | Individual tool calls beyond the chat limit are not counted separately                                                          |
| Share token creation (`POST /api/share`)                                         | Auth check only                                         | All tiers can create share tokens with any combination of shareable fields; no limit on token lifespan or re-creation frequency |
| Google Calendar integration & manual sync (`POST /api/integrations/google/sync`) | Auth check only                                         | No tier gate on enabling the integration or triggering a manual sync; available equally to all tiers                            |

---

## Counter fields on `User`

Added in migration `20260331173106_add_plan_enforcement_counters`.

| Field                  | Purpose                                  | Resets                                                                  |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `chatsDailyCount`      | Number of chats created today            | At UTC midnight (lazy reset on next write)                              |
| `chatsDailyDate`       | Date string (`YYYY-MM-DD`) for the above | —                                                                       |
| `widgetChatsCount`     | Widget chat messages today               | At UTC midnight                                                         |
| `widgetToolsCount`     | Widget tool calls today                  | At UTC midnight                                                         |
| `widgetCountsDate`     | Date string for both widget counters     | —                                                                       |
| `knowledgeUploadsUsed` | Total documents currently stored         | Decremented on delete (must be done in `lib/knowledge/delete.logic.ts`) |

> **Important:** `knowledgeUploadsUsed` must be decremented whenever a knowledge document is deleted. Verify `lib/knowledge/delete.logic.ts` does this — if it uses a raw `db.knowledgeDocument.delete()` without updating the counter the quota will drift.

---

## What still needs to be built

### P1 — Row limits for entity types (meetings, tasks, contacts, decisions)

The spec does not define these limits today. Before enforcing them, agree on the numbers and add them to `PlanLimits` in `types/billing.ts`. Once defined:

- Add `assertWithinPlan` calls to each `create.logic.ts`
- Add corresponding counter fields or use live `count()` queries

### P2 — Tier-aware briefing gate

Replace the flat `briefingRateLimiter` with a per-tier daily LLM call budget, or at minimum gate the cron briefing job so `free` tier users do not consume LLM calls via overnight cron.

### P3 — Decrement `knowledgeUploadsUsed` on document delete

Audit `lib/knowledge/delete.logic.ts`. If it does not call `db.user.update({ data: { knowledgeUploadsUsed: { decrement: 1 } } })`, the free-tier doc quota can never free up after deletion.

### P4 — AI tool calls from main chat counted against a budget

Users can bypass the daily chat limit by making a single chat that triggers many tool calls (create 10 meetings in one message). Consider whether tool executions should count against a separate daily AI-action quota, especially for `free` tier.

### P5 — Share token access gating

`POST /api/share` is available to all tiers. If sharing should be a `pro`/`premium`-only feature, add an `assertWithinPlan` check in `lib/share/create.logic.ts`. At minimum, consider limiting the number of active share tokens a `free` user can hold.

### P6 — Google Calendar integration tier gating

The Google Calendar integration is available to all tiers. If it should be restricted (e.g. `pro` and above), add a tier check in `lib/integrations/google-calendar.logic.ts` before the sync runs. Also relevant: the scheduled cron sync runs for all users who have a connected Google account, regardless of tier.

### P7 — Reports storage limit

Reports are auto-generated after every chat tool batch and accumulate indefinitely. There is no cap per user. Consider either: (a) a rolling window (keep last N reports per tier), or (b) a tier-based total storage limit, enforced in `lib/reports/generate.logic.ts`.

### P8 — Chat stream LLM budget

The `chatRateLimiter` (30 msg/60 s) prevents burst abuse but does not enforce a per-tier daily LLM message budget inside an open chat session. A `free` user who opens one chat can send hundreds of messages per day. Consider adding a `streamMessagesDailyCount` counter (similar to `chatsDailyCount`) enforced in `POST /api/chat/[chatId]/stream`.

---

## Design principles

- **Limits apply to creation, not viewing.** Users can always read, export, or review data they already created.
- **All counters reset at UTC midnight** (lazy: detected on the next write, not by cron sweep).
- **`PlanLimitError`** is the typed error thrown by `enforce.logic.ts`. API routes should catch it and return `{ error: message, resource }` with HTTP 402 or 429.
- **`free` tier is the safe default.** Any unrecognised tier string falls back to `free` limits via `getPlanLimits()`.
