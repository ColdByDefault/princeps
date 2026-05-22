# 07 - Tier System

Last updated: 2026-05-07

Read this when working on plan limits, billing tiers, usage counters, quota checks, gated tools, pricing, or the Settings usage UI.

Reference examples:

- `tasks` shows a free feature with an at-rest quota.
- Meeting prep packs show a non-free feature with a `0 = disabled` free limit, monthly quota, and `pro` tool gate.

## Tier Principle

Princeps has four user tiers:

```text
free -> pro -> premium -> enterprise
```

Tier enforcement has two separate jobs:

- Limit usage volume: record counts, monthly messages, tokens, tool calls, uploads, voice minutes, prep packs, briefings.
- Shape feature access: some LLM tools or expensive actions are hidden or blocked below a required tier.

The user's current tier is stored on `User.tier` in `prisma/schema.prisma`. Stripe subscription sync updates this field through `lib/platform/stripe/sync.ts`.

## Core Files

```text
types/billing.ts             Tier type, PLAN_LIMITS, PLAN_PRICES, UsageSummary
lib/platform/tiers/enforce.ts         enforce* functions and createTierLimitResponse()
lib/platform/tiers/index.ts           tier barrel exports
prisma/schema.prisma         User.tier and UsageCounter model
lib/platform/settings/usage.logic.ts  server-side Settings usage snapshot
components/settings/UsageTab.tsx
lib/ai/tools/registry.ts        minTier filtering for LLM tools
lib/ai/tools/executor.ts        defense-in-depth active-tool check
```

## Plan Limits

`types/billing.ts` is the source of truth for current limits.

Each tier maps to a `PlanLimits` object:

```ts
export const PLAN_LIMITS: Record<Tier, PlanLimits> = {
  free: { tasksMax: 20, prepPacksPerMonth: 0, ... },
  pro: { tasksMax: 100, prepPacksPerMonth: 10, ... },
  premium: { tasksMax: 500, prepPacksPerMonth: 25, ... },
  enterprise: { tasksMax: -1, prepPacksPerMonth: 100, ... },
};
```

Sentinels:

- `-1` means unlimited. Enforcement skips the count check.
- `0` means disabled for that tier when used on feature/action quotas.

Do not duplicate plan values elsewhere. Import `getPlanLimits(tier)`.

## Limit Types

Princeps uses several limit styles:

- At-rest caps: current stored records, no reset. Examples: tasks, contacts, meetings, decisions, goals, memory, knowledge documents.
- Daily burst guards: reset by UTC `YYYY-MM-DD`. Examples: chats/day, widget messages, voice requests/day, briefing daily guard.
- Monthly quotas: reset by UTC `YYYY-MM`. Examples: messages, tokens, tool calls, prep packs, briefings, voice requests/month.
- Lifetime counters: never decrement. Example: `knowledgeCharsUsed` prevents delete-and-reupload bypass.
- Feature availability gates: `0` quota or `minTier` hides/blocks the feature below a tier.

## UsageCounter

`UsageCounter` stores rolling usage counters for each user.

The enforcement helpers call `getOrCreateCounter(userId)` internally when a counter row is needed. Monthly counters reset lazily when `monthlyResetDate` no longer matches the current `YYYY-MM`; daily counters reset lazily when their stored date no longer matches the current `YYYY-MM-DD`.

Counters should be incremented only when an action is allowed and actually being consumed.

## Enforcement Helpers

All plan gates live in `lib/platform/tiers/enforce.ts`.

Common patterns:

- `enforceTasksMax(userId)` counts current tasks and compares with `tasksMax`.
- `enforceMonthlyLimits(userId)` checks/increments monthly chat message quota and checks token budget.
- `accumulateTokens(userId, ...)` adds approximate token use after the response, fire-and-forget.
- `enforceToolCallsMonthly(userId, count)` checks/increments monthly tool-call usage.
- `enforcePrepPackMonthly(userId)` checks `prepPacksPerMonth`; `0` blocks the feature.
- `createTierLimitResponse(reason)` returns a `403` JSON response.

Enforcement belongs before writes or expensive calls.

## Example: Tasks

Tasks are available on the free tier, but task creation is quota-gated.

Current task limits:

```text
free: 20
pro: 100
premium: 500
enterprise: unlimited (-1)
```

API route path:

```text
app/api/tasks/route.ts POST
  -> authenticate
  -> writeRateLimiter
  -> enforceTasksMax(userId)
  -> validate createTaskSchema
  -> createTask(userId, input)
```

LLM tool path:

```text
create_task registry minTier: "free"
tasks.handler.ts
  -> resolve labelNames to labelIds
  -> validate createTaskSchema
  -> duplicate active-task check
  -> enforceTasksMax(userId)
  -> createTask(userId, parsed.data)
```

Takeaway: free users can use task tools and the UI, but both paths must block creating task number 21.

## Example: Meeting Prep Packs

Meeting prep packs are a non-free, expensive AI feature.

Current prep-pack limits:

```text
free: 0 per month (disabled)
pro: 10 per month
premium: 25 per month
enterprise: 100 per month
```

Tool gate:

```text
generate_meeting_prep_pack minTier: "pro"
get_meeting_prep_pack      minTier: "pro"
clear_meeting_prep_pack    minTier: "pro"
update_meeting_prep_pack   minTier: "pro"
```

API generation path:

```text
app/api/meetings/[id]/prep-pack/route.ts POST
  -> authenticate
  -> writeRateLimiter
  -> enforcePrepPackMonthly(userId)
  -> enforceToolCallsMonthly(userId)
  -> generatePrepPack(meetingId, userId)
```

Takeaway: non-free features may be protected twice: hidden from the LLM by `minTier`, and blocked at execution time by quota enforcement.

## Tool Tier Gates

LLM tools carry `minTier` in their registry entries.

`lib/ai/tools/registry.ts` filters tools through:

```text
getToolsForTier(tier, disabledToolNames)
getActiveToolsForUser(userId)
```

The filtered tool list is:

- Passed to the LLM provider.
- Reflected in the system prompt.
- Checked again in `executeToolCall()` before dispatch.

This means a free user should not see or call `pro` tools such as `create_decision`, `web_search`, or `generate_meeting_prep_pack`.

## API Gates vs Tool Gates

Do not confuse these:

- API gates protect HTTP routes and UI-triggered actions.
- Tool gates protect LLM-callable actions.

When an action exists in both places, both paths need equivalent enforcement.

Some features have a free UI/API quota but a higher tool tier. Check live code before assuming the UI and LLM tool have identical availability.

## Billing Sync

Stripe changes update `User.tier`.

Current flow:

```text
Stripe checkout / webhook
  -> price ID
  -> tierFromPriceId(priceId)
  -> syncUserTierFromSubscription()
  -> db.user.update({ tier })
```

If a subscription is inactive, deleted, or has an unknown price ID, the runtime fallback tier is `free`.

## Usage UI

`lib/platform/settings/usage.logic.ts` produces a `UsageSummary`.

It combines:

- Current `User.tier`.
- Live counts of stored records.
- `UsageCounter` monthly/daily counters.
- Limits from `getPlanLimits(tier)`.

`components/settings/UsageTab.tsx` renders quota cards. When adding a new tracked limit, update:

- `PlanLimits`
- `PLAN_LIMITS`
- `UsageCounter` if it needs a counter
- enforcement helper
- `UsageSummary`
- `getUserUsage()`
- `UsageTab`
- both locale files

## Adding A New Tier-Gated Feature

For a new quota-gated feature or action:

1. Add fields to `PlanLimits`.
2. Add values for all tiers in `PLAN_LIMITS`.
3. Add `UsageCounter` fields if the quota is daily/monthly/lifetime.
4. Add an `enforce*()` helper in `lib/platform/tiers/enforce.ts`.
5. Export the helper from `lib/platform/tiers/index.ts`.
6. Call it in API routes before writes or expensive work.
7. Call it in LLM tool handlers before writes or expensive work.
8. Add `minTier` to tool registry entries if the LLM tool should be hidden below a tier.
9. Update usage summary and Settings UI if users should see the quota.
10. Update docs/context when the tier contract changes.

## Tier Checklist

Before finishing tier-related work, verify:

- `types/billing.ts` is the source of truth for limits.
- `-1` and `0` are interpreted correctly.
- API routes enforce gates before writes or expensive calls.
- Tool handlers enforce the same action gate.
- Tool registry `minTier` matches intended LLM availability.
- Chat and widget receive filtered active tools.
- Usage counters reset lazily on the correct date boundary.
- Lifetime counters do not decrement if they are anti-bypass gates.
- Stripe sync maps price IDs to the intended tier.
- Settings usage display and i18n are updated when visible quotas change.
