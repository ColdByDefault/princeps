# Tier System

**Four tiers:** `free` | `pro` | `premium` | `enterprise`

> The name `enterprise` may feel like a B2B contract tier; this is a personal product. A future rename to `executive` is under consideration but has not been applied to the codebase yet.

---

## Pricing (EUR)

Retail prices are calibrated at a ~5–8× markup over the estimated OpenAI GPT-4o infrastructure cost per tier.

| Tier           | LLM cost/month (est.) | Monthly price | Annual price |
| -------------- | --------------------- | ------------- | ------------ |
| **Free**       | ~€0.45                | €0            | —            |
| **Pro**        | ~€1.80                | €9/month      | €89/year     |
| **Premium**    | ~€4.50                | €19/month     | €179/year    |
| **Enterprise** | ~€13.50               | €49/month     | €449/year    |

---

## Limit model — axes

| Axis              | Field              | Resets               | Purpose                                        |
| ----------------- | ------------------ | -------------------- | ---------------------------------------------- |
| At-rest slot      | `chatHistoryTotal` | Never                | Hard cap on stored chats regardless of deletes |
| At-rest slot      | `tasksMax`         | Never                | Hard cap on active tasks                       |
| At-rest slot      | `meetingsMax`      | Never                | Hard cap on stored meetings                    |
| At-rest slot      | `decisionsMax`     | Never                | Hard cap on stored decisions                   |
| At-rest slot      | `contactsMax`      | Never                | Hard cap on stored contacts                    |
| Daily burst guard | `chatsPerDay`      | Daily (`YYYY-MM-DD`) | Prevent chat-creation spam                     |
| Monthly quota     | `messagesPerMonth` | Monthly (`YYYY-MM`)  | Primary LLM usage gate                         |
| Monthly budget    | `tokensPerMonth`   | Monthly (`YYYY-MM`)  | Approximate token spend gate                   |

---

## Plan limits

Calibrated to OpenAI GPT-4o blended rate ~$0.0075/exchange.

| Limit                            | free  | pro  | premium | enterprise |
| -------------------------------- | ----- | ---- | ------- | ---------- |
| Chat history (at-rest, no reset) | 10    | 25   | 50      | 200        |
| Chats/day (burst guard)          | 3     | 5    | 10      | 20         |
| Messages/month                   | 75    | 250  | 650     | 2,000      |
| Approx tokens/month              | 125k  | 400k | 1M      | 3M         |
| Tool calls/month                 | 50    | 200  | 500     | 2,000      |
| Tasks (at-rest)                  | 20    | 100  | 500     | unlimited  |
| Meetings (at-rest)               | 10    | 50   | 200     | unlimited  |
| Decisions (at-rest)              | 10    | 50   | 200     | unlimited  |
| Contacts (at-rest)               | 10    | 50   | 150     | unlimited  |
| Knowledge docs (at-rest)         | 3     | 25   | 50      | 200        |
| Knowledge file size              | 500KB | 2MB  | 5MB     | 20MB       |
| Widget chats/day                 | 30    | 60   | 120     | 300        |
| Widget tool calls/day            | 5     | 25   | 50      | 100        |
| Nudges (proactive notifications) | No    | Yes  | Yes     | Yes        |

> **Note on contacts cap:** An executive assistant managing a real network realistically needs 100–500 contacts. The contacts limits were raised from the original 25/50/100 to 50/150/unlimited to better reflect this use case.

---

## Tool gating by tier

Quantity limits alone are not sufficient to create a clear value ladder. Strategic and power features are additionally gated behind higher tiers. The minimum tier required to call a tool is encoded as `minTier` in `TOOL_REGISTRY` entries.

Tool tier assignment is enforced at **two points**:

1. The tool list sent to the LLM is filtered to the user's tier — the LLM is only told about tools it can actually call.
2. The system prompt `Available Tools:` line reflects the same filtered set.

If a user tries to prompt the LLM to use a tool not in their tier, the LLM simply cannot call it (it doesn't know it exists).

| Tool group                              | Min tier  | Rationale                                               |
| --------------------------------------- | --------- | ------------------------------------------------------- |
| Tasks (CRUD), Labels, `get_user_info`   | `free`    | Core utility — every user needs this                    |
| Meetings (CRUD), Contacts (CRUD)        | `free`    | Core utility — quantity-capped separately               |
| Decisions (CRUD)                        | `pro`     | Strategic/reasoning feature                             |
| Knowledge retrieval in chat             | `pro`     | Already doc-count-gated; tool itself is a power feature |
| Cross-linking (contacts→meetings, etc.) | `pro`     | Power feature; depends on Decisions + Notes (#27)       |
| Briefings (#22)                         | `premium` | Expensive scheduled LLM call                            |
| Goals (#23)                             | `premium` | Complex planning feature                                |
| Meeting prep pack (#19)                 | `premium` | High-token LLM operation                                |
| Calendar sync (#28)                     | `premium` | OAuth integration + external API                        |

> Tools for features not yet built (briefings, goals, prep pack, calendar) have no registry entry yet — they cannot be called regardless of tier. When those features are implemented, their registry entries will carry `minTier` from day one.

---

## Key design decisions

- Deleting and recreating records does **not** bypass at-rest limits — counts are re-evaluated at create time.
- Deleting and recreating chats does **not** bypass limits — `chatsPerDay` burns regardless, and `messagesPerMonth` is the real gate.
- Token counting is approximate: `Math.ceil((userChars + assistantChars) / 4)`. No cost tracking — just a budget proxy.
- Token accumulation is **fire-and-forget** after the stream completes — never blocks the response.
- Monthly counters auto-reset when a new `YYYY-MM` is detected — no cron job required.
- `unlimited` in the table means no count check is performed, not an actual `Infinity` value — check the `PlanLimits` interface for the sentinel used in code.

---

## Enforcement audit (as of April 2026)

| Layer                     | What is checked                        | Status                                    |
| ------------------------- | -------------------------------------- | ----------------------------------------- |
| `enforceMonthlyLimits`    | Messages + tokens/month                | ✅ Applied in stream route                |
| `enforceToolCallsMonthly` | Tool call budget/month                 | ✅ Applied in stream route                |
| `enforceContactsMax`      | Contacts at-rest                       | ✅ Applied in API route + tool handler    |
| `enforceKnowledgeUpload`  | Doc count + file size + lifetime chars | ✅ Applied in API route                   |
| `enforceTasksMax`         | Tasks at-rest                          | ✅ Applied in API route + tool handler    |
| `enforceMeetingsMax`      | Meetings at-rest                       | ✅ Applied in API route + tool handler    |
| `enforceDecisionsMax`     | Decisions at-rest                      | ✅ Applied in API route + tool handler    |
| Per-tool tier gate        | Tool availability by tier              | ⚠ TODO — task #25                         |
| System prompt tool list   | Filtered to user's tier                | ⚠ TODO — task #25                         |
| Rate limiter (burst)      | Per-IP/user write rate                 | ✅ Applied; in-memory only — see task #34 |

---

## Relevant files

- `types/billing.ts` — `Tier` type, `PlanLimits` interface, `PLAN_LIMITS` table, `getPlanLimits()`
- `lib/tiers/enforce.ts` — all `enforce*()` functions
- `lib/tiers/index.ts` — barrel exports
- `lib/tools/registry.ts` — `TOOL_REGISTRY`; each entry will carry `minTier` once task #25 is implemented
- `lib/context/build.ts` — assembles system prompt; `Available Tools:` line must be filtered by tier
- `app/api/chat/[chatId]/stream/route.ts` — passes `TOOL_REGISTRY` to the LLM; must be filtered by tier
- `lib/settings/usage.logic.ts` — reads `UsageCounter` + record counts for the settings Usage tab
- `prisma/schema.prisma` → `UsageCounter` model — `messageMonthlyCount`, `tokenMonthlyCount`, `monthlyResetDate`
- `components/settings/UsageTab.tsx` — settings UI showing live quota bars
- `components/pricing/PricingShell.tsx` — pricing page; will need EUR price column once billing is wired
