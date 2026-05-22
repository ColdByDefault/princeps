# Sub-Agents System

Last updated: 2026-05-21

This document describes the planned sub-agents architecture for Princeps — a way to let the assistant delegate specialised work to focused, purpose-built agents rather than doing everything in a single chat loop.

---

## Problem

The current chat loop handles all requests in one pass: build system prompt → stream tokens → execute tool calls → repeat up to 6 rounds → final text response.

This works well for single-domain actions ("create a task", "recall a contact") but breaks down for multi-step, cross-domain work such as:

- "Process my voice memo and extract tasks, decisions, and meeting notes."
- "Monitor a topic and surface a weekly signal digest."
- "Run my weekly review ritual."

These workflows need planning, parallel data gathering, synthesis, and conditional branching — none of which fit neatly into the 6-round single-thread model.

---

## Goal

Add a sub-agents layer that lets the main assistant (the **orchestrator**) delegate bounded units of work to small, focused **sub-agents**, each with a narrow system prompt, a restricted tool set, and a well-defined output contract.

Sub-agents are **not** visible to the user. They run server-side, return structured results, and the orchestrator incorporates those results into the final user-facing response.

---

## Design Principles

1. **Orchestrator owns the user conversation.** Sub-agents are internal workers.
2. **Each sub-agent has a single responsibility.** Narrow scope = predictable output.
3. **Sub-agents use the same `lib/ai/tools/` layer.** No parallel tool system needed.
4. **Sub-agents are stateless per invocation.** Context is passed in; state is written to the DB.
5. **Any surface can trigger a sub-agent.** Chat, cron, webhooks, and future automation pipelines all use the same runner.
6. **Tier and usage gates are enforced inside each sub-agent**, just like regular tool handlers.

---

## Architecture

```text
lib/ai/agents/
  types.ts                    AgentInput, AgentOutput, AgentDefinition
  runner.ts                   runAgent(agentName, input, userId) → AgentOutput
  registry.ts                 Maps agent names to definitions
  agents/
    task-extractor.agent.ts   Extract tasks from free text or voice memo transcript
    decision-logger.agent.ts  Extract and log decisions from meeting notes
    weekly-review.agent.ts    Run the structured weekly review ritual
    signal-feed.agent.ts      Fetch + score + summarise topic signals
    <purpose>.agent.ts        One file per sub-agent
```

### Agent Definition Shape

```ts
type AgentDefinition = {
  name: string; // stable snake_case identifier
  description: string; // used by orchestrator to decide when to delegate
  systemPrompt: string; // narrow, task-specific instructions
  tools: string[]; // allowed tool names from lib/ai/tools/registry.ts
  minTier: Tier; // minimum user tier to invoke this agent
  maxRounds?: number; // default 3; orchestrator can override
};
```

### Runner Contract

```ts
type AgentInput = {
  userId: string;
  userMessage: string;
  context?: string; // optional pre-built context string
};

type AgentOutput = {
  ok: boolean;
  summary: string; // concise result for the orchestrator to use
  actions?: ActionResult[]; // tool call results performed during the run
  error?: string;
};
```

`runner.ts` is the only entry point. It:

1. Looks up the `AgentDefinition` by name.
2. Enforces the `minTier` gate.
3. Builds a minimal system prompt from the definition.
4. Calls `streamChat` / `callChat` with the restricted tool set.
5. Executes tool calls via `executeToolCall` (reuses the existing executor).
6. Returns an `AgentOutput` summary to the orchestrator.

---

## Orchestrator Integration

The main chat route gains a pre-pass step:

```text
1. classify(userMessage) → decide if delegation is useful
2. for each delegated task: runAgent(agentName, input, userId)
3. append AgentOutput summaries to the conversation as assistant context
4. continue normal streaming chat with full tool set
```

The orchestrator does **not** stream sub-agent work to the user. It waits for sub-agent results, then streams its own synthesis.

A new `classify` helper (`lib/ai/agents/classify.ts`) uses a lightweight LLM call to map a user message to zero or more agent names. It is cheap (no tools, short prompt, small model) and returns quickly.

---

## Planned Sub-Agents (Phase 1)

| Agent             | Trigger                                  | Tools Used                                  | Output                                       |
| ----------------- | ---------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `task-extractor`  | Voice memo / long text with action items | `create_task`, `list_tasks`                 | Tasks created; summary of what was extracted |
| `decision-logger` | Meeting note / recap with decisions      | `create_decision`, `list_decisions`         | Decisions logged; summary                    |
| `weekly-review`   | "Run my weekly review" / cron            | `list_tasks`, `list_meetings`, `list_goals` | Structured review summary                    |
| `signal-feed`     | Cron / "what's happening in X"           | `web_search` (future), `create_knowledge`   | Scored digest written to knowledge base      |

---

## Relationship to Existing Issues

| Issue                                  | Addressed By                                   |
| -------------------------------------- | ---------------------------------------------- |
| #86 F1 — Commitment Tracker            | `commitment-tracker` agent (Phase 2)           |
| #87 F2 — Voice Memo → Structured Data  | `task-extractor` + `decision-logger` agents    |
| #88 F3 — Reading Queue with AI scoring | `signal-feed` agent extended to score articles |
| #84 E1 — Decision Outcome Journal      | `decision-logger` agent output                 |
| #91 G3 — Weekly Review ritual          | `weekly-review` agent                          |
| #93 G5 — Signal / Intelligence Feed    | `signal-feed` agent                            |

---

## Implementation Order

1. **`lib/ai/agents/types.ts`** — shared types.
2. **`lib/ai/agents/runner.ts`** — minimal runner using existing `callChat` + `executeToolCall`.
3. **`lib/ai/agents/registry.ts`** — agent name → definition map.
4. **`lib/ai/agents/agents/task-extractor.agent.ts`** — first real agent, narrow scope, easy to test.
5. **`lib/ai/agents/classify.ts`** — lightweight orchestrator routing helper.
6. Update **`app/api/chat/[chatId]/stream/route.ts`** — add pre-pass delegation step.
7. Add remaining Phase 1 agents one at a time.
8. Add cron trigger support for agents that run on a schedule.

---

## What This Is Not

- Not a multi-user agentic platform.
- Not autonomous background workers with persistent memory loops.
- Not a replacement for the tool system — agents call the same tools.
- Not exposed as a public API.

Sub-agents are an internal orchestration pattern for the Princeps executive assistant. They stay invisible to the user and are always user-scoped.

---

## Implementation Status — Phase 1 complete + Phase 2 (canary/v1.1.3)

All known gaps from the Phase 1 review are resolved. Phase 2 adds the `commitment-tracker` agent and cron triggers.

### Files added (Phase 1 original)

| File                                            | Purpose                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `lib/ai/agents/types.ts`                        | `AgentDefinition`, `AgentInput`, `AgentOutput`, `AgentActionCall` types   |
| `lib/ai/agents/runner.ts`                       | `runAgentWithDefinition()` — tier gate, tool filtering, `streamChat` loop |
| `lib/ai/agents/registry.ts`                     | `AGENT_REGISTRY`, `getAgentDefinition()`, public `runAgent(name, input)`  |
| `lib/ai/agents/classify.ts`                     | `classifyMessage(msg, userTier?)` — tier-filtered routing call            |
| `lib/ai/agents/agents/task-extractor.agent.ts`  | Extracts action items → `create_task` calls                               |
| `lib/ai/agents/agents/decision-logger.agent.ts` | Extracts decisions → `create_decision` calls                              |
| `lib/ai/agents/agents/weekly-review.agent.ts`   | Gathers tasks + meetings + goals → executive digest                       |
| `lib/ai/agents/agents/signal-feed.agent.ts`     | Web search + knowledge cross-ref → scored intelligence digest             |

### Files added (Phase 2 / gap fixes)

| File                                               | Purpose                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| `lib/ai/agents/agents/commitment-tracker.agent.ts` | Extracts commitments from meeting notes → `create_task` follow-ups (issue #86 F1) |
| `app/api/cron/weekly-review/route.ts`              | Cron handler — runs `weekly-review` for all pro+ users every Monday at 08:00 UTC  |
| `app/api/cron/signal-feed/route.ts`                | Cron handler — runs `signal-feed` for pro+ users with `signalTopics` every Monday |

### Files modified

| File                                              | Change                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/chat/[chatId]/stream/route.ts`           | Agent pre-pass with tier-aware classify; `reportDetails` hoisted before stream and seeded with agent tool calls; `getUserTier` added to batch |
| `lib/platform/tiers/enforce.ts`                   | `getUserTier` exported (was private)                                                                                                          |
| `lib/platform/tiers/index.ts`                     | Re-exports `getUserTier`                                                                                                                      |
| `lib/platform/settings/user-preferences.logic.ts` | Added `signalTopics: string[]` field — used by signal-feed cron to know what to fetch                                                         |
| `vercel.json`                                     | Added `weekly-review` (Mon 08:00) and `signal-feed` (Mon 06:00) cron entries                                                                  |

### Key implementation notes

- `runner.ts` uses `streamChat` (not `callChat`) — `callChat` does not forward the `tools` array to the provider API.
- Tool filtering: the runner intersects `definition.tools` with `getActiveToolsForUser()`, so both tier gates and user-level tool toggles are respected.
- **Early exit guard**: if the intersection is empty, the runner returns `{ ok: false }` immediately rather than running a text-only agent pass.
- Classifier receives the user's tier and only sees agents at or below that tier — no wasted LLM calls for gated agents.
- Classifier output is validated against `AGENT_REGISTRY` keys — hallucinated names are silently dropped.
- All agent failures are silent: `runner.ts` never throws, `classifyMessage` returns `[]` on any error. The main chat loop is unaffected.
- **Agent calls visible in reports**: `AgentOutput.agentCalls` carries `{ toolName, args, result }`. The stream route seeds `reportDetails` from these before the `ReadableStream` starts.
- `signal-feed` is still read-only. A future `create_knowledge` tool will allow it to persist digests to the knowledge base.
- Signal-feed cron only runs for users who have at least one `signalTopics` entry in their preferences.

---

## Known Gaps & Remaining Work

### `signal-feed` is still read-only

The agent can search the web and query the knowledge base but cannot persist digests. Requires a future `create_knowledge` tool. When that tool is added, update `signalFeedAgent.tools` to include it and update the `signal-feed` system prompt.

### Classifier still triggers on every message

The classifier always runs a cheap LLM call regardless of message content. A fast heuristic pre-check (keyword detection or message length threshold) could skip the classify call entirely for short conversational messages and avoid a redundant round-trip.

### Commitment tracker has no contact creation

The `commitment-tracker` agent uses `list_contacts` to find existing contacts but does not create new ones. If the named person is not in the contacts list, the task is still created but without a contact link. Add `create_contact` to its tool list if contact auto-creation on commitment extraction is desired.
