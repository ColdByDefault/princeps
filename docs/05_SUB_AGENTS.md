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

## Implementation Status — Phase 1 (canary/v1.1.3)

All 8 steps from the implementation order above are complete.

### Files added

| File                                            | Purpose                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `lib/ai/agents/types.ts`                        | `AgentDefinition`, `AgentInput`, `AgentOutput` shared types               |
| `lib/ai/agents/runner.ts`                       | `runAgentWithDefinition()` — tier gate, tool filtering, `streamChat` loop |
| `lib/ai/agents/registry.ts`                     | `AGENT_REGISTRY`, `getAgentDefinition()`, public `runAgent(name, input)`  |
| `lib/ai/agents/classify.ts`                     | `classifyMessage()` — cheap `callChat` routing call, returns `string[]`   |
| `lib/ai/agents/agents/task-extractor.agent.ts`  | Extracts action items → `create_task` calls                               |
| `lib/ai/agents/agents/decision-logger.agent.ts` | Extracts decisions → `create_decision` calls                              |
| `lib/ai/agents/agents/weekly-review.agent.ts`   | Gathers tasks + meetings + goals → executive digest                       |
| `lib/ai/agents/agents/signal-feed.agent.ts`     | Web search + knowledge cross-ref → scored intelligence digest             |

### Files modified

| File                                    | Change                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `app/api/chat/[chatId]/stream/route.ts` | Added sub-agent pre-pass: classify → run agents in parallel → inject summaries as synthetic assistant turn before final user message |

### Key implementation notes

- `runner.ts` uses `streamChat` (not `callChat`) — `callChat` does not forward the `tools` array to the provider API.
- Tool filtering: the runner intersects `definition.tools` with `getActiveToolsForUser()`, so both tier gates and user-level tool toggles are respected.
- Classifier output is validated against `AGENT_REGISTRY` keys — hallucinated names are silently dropped.
- All agent failures are silent: `runner.ts` never throws, `classifyMessage` returns `[]` on any error. The main chat loop is unaffected.
- `signal-feed` uses `web_search`, `fetch_url`, and `search_knowledge`. A future `create_knowledge` tool will allow it to persist digests to the knowledge base.

---

## Known Gaps & Next Steps (canary/v1.1.3)

Questions raised during review — answers documented for the next session.

### Q1 — Is Phase 1 enough to cover everything?

No. Phase 1 covers the core extraction and review use cases but three gaps remain:

- **Cron triggers not implemented** (step 8 from the implementation order). `weekly-review` and `signal-feed` only run when triggered via chat. Scheduled execution (e.g. every Monday morning) needs an API cron endpoint that calls `runAgent` directly.
- **`signal-feed` is read-only.** It can search the web and query the knowledge base but cannot persist digests. Requires a future `create_knowledge` tool.
- **`commitment-tracker` (Phase 2) not built.** Referenced in the issues table but no agent file exists yet.

### Q2 — Is the orchestrator aware and can it logically call agents?

Yes, and it is automatic. `classifyMessage()` builds its routing prompt dynamically from `AGENT_REGISTRY` at call time — registering a new agent is sufficient for the orchestrator to discover and route to it, with no other wiring needed.

One known inefficiency: the classifier does not receive the user's tier before running. It may suggest a `pro`-only agent (e.g. `weekly-review`) for a free-tier user. The runner's tier gate correctly blocks the run and returns a silent failure, so the outcome is correct — but a wasted classify + runner call occurs. Fix: pass the user tier into `classifyMessage` to pre-filter candidates from `AGENT_REGISTRY`.

### Q3 — Do agents respect the tools tier rules?

Yes — three independent layers enforce this:

1. **Agent `minTier` gate** (`runner.ts`) — checked first. A free user cannot run `weekly-review` or `signal-feed` (both `minTier: "pro"`).
2. **Tool whitelist** (`runner.ts`) — `getActiveToolsForUser()` returns only the tools the user's tier and preferences allow. The LLM is offered only the intersection of those and `definition.tools`.
3. **Executor gate** (`executeToolCall`) — re-runs `getActiveToolsForUser()` as a second check. Even if the LLM names a tool it was not offered, the executor blocks it.

One edge case: if every tool in `definition.tools` is filtered out by layer 2 (e.g. all tools individually disabled), the agent still runs but produces a text-only response instead of failing early. Fix: add an early guard in `runner.ts` — `if (agentTools.length === 0) return { ok: false, error: "No tools available for this agent." }`.

### Q4 — Are agent tool calls included in the reports?

**No — agent tool calls are invisible to the reports system.** Two reasons:

1. `reportDetails` is declared inside the `ReadableStream` closure, which initialises after the pre-pass completes. Pre-pass results never reach it.
2. `AgentOutput.actions` stores `ActionResult[]` only — it loses the tool name and arguments, so `buildDetailCall` cannot reconstruct a `ReportDetailCall` from it.

Fix (not yet implemented) requires three changes:

- **`types.ts`** — add `AgentActionCall` type: `{ toolName: string; args: string; result: ActionResult }` and add `agentCalls?: AgentActionCall[]` to `AgentOutput`.
- **`runner.ts`** — capture `{ toolName, args, result }` during the tool loop instead of only `result`.
- **`stream/route.ts`** — convert `agentResults[].agentCalls` to `ReportDetailCall[]` entries and seed `reportDetails` with them before the main streaming loop starts.
