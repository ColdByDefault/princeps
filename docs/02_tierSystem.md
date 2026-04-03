### Tier system redesign

**Four tiers:** `free` | `pro` | `premium` | `enterprise`

**Limit model — two independent axes:**

| Axis              | Field              | Resets               | Purpose                                        |
| ----------------- | ------------------ | -------------------- | ---------------------------------------------- |
| At-rest slot      | `chatHistoryTotal` | Never                | Hard cap on stored chats regardless of deletes |
| Daily burst guard | `chatsPerDay`      | Daily (`YYYY-MM-DD`) | Prevent chat-creation spam                     |
| Monthly quota     | `messagesPerMonth` | Monthly (`YYYY-MM`)  | Primary LLM usage gate                         |
| Monthly budget    | `tokensPerMonth`   | Monthly (`YYYY-MM`)  | Approximate token spend gate                   |

**Plan limits (calibrated to OpenAI GPT-4o blended rate ~$0.0075/exchange):**

| Limit                            | free (~$0.50) | pro (~$2) | premium (~$5) | enterprise (~$15) |
| -------------------------------- | ------------- | --------- | ------------- | ----------------- |
| Chat history (at-rest, no reset) | 10            | 25        | 50            | 200               |
| Chats/day (burst guard)          | 3             | 5         | 10            | 20                |
| Messages/month                   | 75            | 250       | 650           | 2,000             |
| Approx tokens/month              | 125k          | 400k      | 1M            | 3M                |
| Widget chats/day                 | 30            | 60        | 120           | 300               |
| Widget tools/day                 | 5             | 25        | 50            | 100               |

**Key design decisions:**

- Deleting and recreating chats does **not** bypass limits — `chatsPerDay` burns regardless of deletes, and `messagesPerMonth` is the real gate.
- Token counting is approximate: `Math.ceil((userChars + assistantChars) / 4)`. No cost math — just a budget proxy.
- Token accumulation is **fire-and-forget** after the stream completes — it never blocks the response.
- Monthly counters auto-reset when a new `YYYY-MM` is detected — no cron job required.

**Relevant files:**

- `types/billing.ts` — `Tier` type, `PlanLimits` interface, `PLAN_LIMITS` table, `getPlanLimits()`
- `lib/tiers/enforce.ts` — `enforceChatsPerDay()`, `enforceMonthlyLimits()`, `accumulateTokens()`, `getChatHistoryLimit()`, etc.
- `lib/tiers/index.ts` — barrel exports
- `lib/settings/usage.logic.ts` — reads `UsageCounter` + chat count for the settings Usage tab
- `prisma/schema.prisma` → `UsageCounter` model — `messageMonthlyCount`, `tokenMonthlyCount`, `monthlyResetDate`
- `components/settings/UsageTab.tsx` — settings UI showing live quota bars