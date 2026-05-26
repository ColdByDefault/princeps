# Sub-Agents System

Last updated: 2026-05-26

This document describes the sub-agents architecture for Princeps — focused, purpose-built agents that the assistant can delegate specialised multi-step work to instead of doing everything in a single chat loop.

---

## Problem

A single chat loop (system prompt → stream → tool calls → repeat → final text) works well for single-domain actions ("create a task", "recall a contact") but breaks down for multi-step, cross-domain work such as:

- "Process my voice memo and extract tasks, decisions, and meeting notes."
- "Monitor a topic and surface a weekly signal digest."
- "Run my weekly review ritual."

These workflows need planning, parallel data gathering, synthesis, and conditional branching — none of which fit neatly into the main chat round budget.

---

## Goal

Add a sub-agents layer that the main assistant (the **orchestrator**) can delegate bounded units of work to. Each sub-agent has a narrow system prompt, a restricted tool set, and a well-defined output contract.

Sub-agents are **not** a separate UI surface — they run server-side and return a structured summary. The orchestrator decides when to invoke them and incorporates the result into the final user-facing response.

---

## Design Principles

1. **Orchestrator owns the user conversation.** Sub-agents are internal workers.
2. **Each sub-agent has a single responsibility.** Narrow scope = predictable output.
3. **Sub-agents are exposed as LLM tools.** They live in the same `lib/ai/tools/` registry as any other tool. No parallel routing system.
4. **Sub-agents use the same executor.** Their internal tool calls flow through `executeToolCall`, so every action is tracked uniformly.
5. **Sub-agents are stateless per invocation.** Context is passed in; state is written to the DB.
6. **Any surface can trigger a sub-agent.** Chat, widget chat, cron, and webhooks all dispatch through the same executor.
7. **Tier and usage gates are enforced on the agent tool entry**, just like regular tool handlers.

---

## Architecture

```text
lib/ai/agents/
  types.ts                    AgentDefinition, AgentInput, AgentOutput, AgentActionCall
  runner.ts                   runAgentWithDefinition(def, input) — internal streamChat loop
  registry.ts                 AGENT_REGISTRY, getAgentDefinition(), runAgent(name, input)
  agents/
    task-extractor.agent.ts       Extract tasks from free text or voice memo transcript
    decision-logger.agent.ts      Extract and log decisions from meeting notes
    weekly-review.agent.ts        Run the structured weekly review ritual
    signal-feed.agent.ts          Fetch + score + summarise topic signals
    commitment-tracker.agent.ts   Extract follow-up commitments from meeting notes

lib/ai/tools/
  registry/agents.registry.ts   One LLM tool entry per agent (run_weekly_review, run_task_extractor, ...)
  handlers/agents.handler.ts    Thin handler that calls runAgent() and wraps AgentOutput as ActionResult
  cron.ts                       runToolFromCron(userId, toolName, args) — cron-side dispatch + report tracking
```

### Agent Definition Shape

```ts
type AgentDefinition = {
  name: string; // stable snake_case identifier (e.g. "task-extractor")
  description: string; // used internally by the runner; not seen by orchestrator
  systemPrompt: string; // narrow, task-specific instructions
  tools: string[]; // allowed tool names from lib/ai/tools/registry.ts
  minTier: Tier; // minimum user tier to invoke this agent
  maxRounds?: number; // default 3
};
```

### Runner Contract

```ts
type AgentInput = {
  userId: string;
  userMessage: string;
  context?: string;
};

type AgentActionCall = {
  toolName: string;
  args: Record<string, unknown>;
  result: ActionResult;
};

type AgentOutput = {
  ok: boolean;
  summary: string; // concise result for the orchestrator and the user
  agentCalls?: AgentActionCall[]; // every tool call the agent executed internally
  error?: string;
};
```

`runAgent(name, input)` is the only entry point. It:

1. Looks up the `AgentDefinition` by name.
2. Enforces the `minTier` gate.
3. Intersects `definition.tools` with `getActiveToolsForUser(userId)` so tier + user toggles are respected.
4. Builds a minimal system prompt from the definition.
5. Calls `streamChat` with the restricted tool set.
6. Executes tool calls via `executeToolCall` (the same executor every surface uses).
7. Records each call as an `AgentActionCall` and returns the final `AgentOutput`.

---

## Orchestrator Integration

The main assistant does **not** run a pre-pass classifier. Instead, every sub-agent is exposed as a regular LLM tool whose name starts with `run_`:

| LLM tool                 | Backing agent        | Min tier |
| ------------------------ | -------------------- | -------- |
| `run_weekly_review`      | `weekly-review`      | pro      |
| `run_task_extractor`     | `task-extractor`     | free     |
| `run_decision_logger`    | `decision-logger`    | free     |
| `run_signal_feed`        | `signal-feed`        | pro      |
| `run_commitment_tracker` | `commitment-tracker` | pro      |

The main LLM decides when to invoke an agent based on the tool description, the same way it picks any other tool. The system prompt (`lib/ai/context/build.ts`) carries explicit routing guidance to bias the model toward the right `run_*` tool and away from manually chaining the underlying tools for the same intent.

### Why this is better than a classifier pre-pass

- **One round-trip removed.** Every chat used to pay a small classify LLM call up front. Now agents only run when the main loop actually picks them.
- **No phantom delegations.** The classifier sometimes fired `task-extractor` on plain review queries, causing duplicate tasks. The orchestrator can now reason about intent in the same context where it answers.
- **Uniform tracking.** Agent invocations are normal tool calls. They appear in `reportDetails`, count toward the user's monthly tool quota, and respect runtime allow-lists.
- **Skill scoping works for free.** A skill's runtime allow-list can include or exclude `run_*` tools just like any other tool.

### Provenance: `kv.agent` on tool report rows

Every chat/widget/cron run produces a `Report` with `ReportDetailCall[]` rows. To make agent activity legible:

1. The outer `run_*` tool row carries `kv.agent = "<agent-name>"` and `kv.summary = "<truncated summary>"`.
2. After the outer row is appended, each entry of `(result.data as AgentToolData).agentCalls` is flattened into its own `ReportDetailCall` row, also tagged with `kv.agent = "<agent-name>"`.
3. The Reports UI ([ReportCard.tsx](../components/settings/reports/ReportCard.tsx)) renders a violet **Agent: \<name\>** badge on tagged rows and indents inner rows under their parent `run_*` row, so it is visually obvious which actions belonged to an agent.

This works for chat, widget chat, and cron uniformly because all three call `executeToolCall` and use the same flattening logic.

---

## Cron Triggers

Cron routes do not call `runAgent` directly. They call `runToolFromCron`, which dispatches through the same `executeToolCall` path the chat surfaces use:

```text
app/api/cron/weekly-review/route.ts
  -> for each eligible user: runToolFromCron(user.id, "run_weekly_review", {})

app/api/cron/signal-feed/route.ts
  -> for each eligible user with signalTopics: runToolFromCron(user.id, "run_signal_feed", { topic })
```

`runToolFromCron` builds a synthetic `LLMToolCall`, calls `executeToolCall`, then (when the user has `reportsEnabled`) creates a `Report` with the same outer + flattened agent-call rows that chat produces. Token usage is accumulated via `accumulateTokens`.

All tracking is best-effort (try/catch fire-and-forget) so a reporting failure never blocks the agent run.

---

## Phase Status (canary/v.1.1.11)

Agents-as-LLM-tools refactor is complete. The classifier pre-pass and `lib/ai/agents/classify.ts` have been removed.

### Files in current use

| File                                               | Purpose                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `lib/ai/agents/types.ts`                           | `AgentDefinition`, `AgentInput`, `AgentOutput`, `AgentActionCall`               |
| `lib/ai/agents/runner.ts`                          | `runAgentWithDefinition()` — tier gate, tool filtering, `streamChat` loop       |
| `lib/ai/agents/registry.ts`                        | `AGENT_REGISTRY`, `getAgentDefinition()`, `runAgent(name, input)`               |
| `lib/ai/agents/agents/task-extractor.agent.ts`     | Extracts action items → `create_task` calls                                     |
| `lib/ai/agents/agents/decision-logger.agent.ts`    | Extracts decisions → `create_decision` calls                                    |
| `lib/ai/agents/agents/weekly-review.agent.ts`      | Gathers tasks + meetings + goals → executive digest                             |
| `lib/ai/agents/agents/signal-feed.agent.ts`        | Web search + knowledge cross-ref → scored intelligence digest                   |
| `lib/ai/agents/agents/commitment-tracker.agent.ts` | Extracts commitments from meeting notes → `create_task` follow-ups (issue #86)  |
| `lib/ai/tools/registry/agents.registry.ts`         | 5 `run_*` LLM tool entries — one per agent                                      |
| `lib/ai/tools/handlers/agents.handler.ts`          | Calls `runAgent()` and packages `AgentOutput` as `ActionResult` with `kv.agent` |
| `lib/ai/tools/cron.ts`                             | `runToolFromCron()` — cron-side executor + report tracking                      |
| `app/api/cron/weekly-review/route.ts`              | Cron entry — dispatches `run_weekly_review` for every pro+ user                 |
| `app/api/cron/signal-feed/route.ts`                | Cron entry — dispatches `run_signal_feed` for pro+ users with `signalTopics`    |
| `components/settings/reports/ReportCard.tsx`       | Renders the **Agent: \<name\>** badge and indents inner rows under `run_*` rows |

### Removed in this refactor

- `lib/ai/agents/classify.ts` — deleted.
- Classifier pre-pass block in `app/api/chat/[chatId]/stream/route.ts` — removed; `runAgent` is no longer imported there.
- `agentRunSummary` SSE event seeding — removed; agent context now reaches the user as the natural tool result of a `run_*` call.

### Key implementation notes

- `runner.ts` uses `streamChat` (not `callChat`) — `callChat` does not forward the `tools` array to the provider.
- Tool filtering inside the runner intersects `definition.tools` with `getActiveToolsForUser(userId)` so tier gates and user-level tool toggles are respected.
- **Early exit guard**: if the intersection is empty, the runner returns `{ ok: false }` immediately instead of running a text-only agent pass.
- Tool entries (`run_*`) carry `minTier` themselves, so the main LLM does not even see agents the user cannot afford.
- All agent failures are silent: `runner.ts` never throws. The `run_*` handler converts failures into `{ ok: false, error }` so the main loop just continues.
- Signal-feed cron only runs for users with at least one `signalTopics` entry in their preferences.
- `signal-feed` is still read-only. A future `create_knowledge` tool will let it persist digests.

---

## What This Is Not

- Not a multi-user agentic platform.
- Not autonomous background workers with persistent memory loops.
- Not a parallel routing system — agents are ordinary LLM tools.
- Not exposed as a public API.

Sub-agents are an internal orchestration pattern for the Princeps executive assistant. They stay invisible as a UI surface and are always user-scoped.

---

## Known Gaps & Remaining Work

### `signal-feed` is still read-only

The agent can search the web and query the knowledge base but cannot persist digests. Requires a future `create_knowledge` tool. When that tool is added, update `signalFeedAgent.tools` to include it and update its system prompt.

### Commitment tracker has no contact creation

The `commitment-tracker` agent uses `list_contacts` to find existing contacts but does not create new ones. If the named person is not in the contacts list, the task is still created but without a contact link. Add `create_contact` to its tool list if contact auto-creation on commitment extraction is desired.
