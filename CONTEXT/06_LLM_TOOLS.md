# 06 - LLM Tools

Last updated: 2026-05-25

Read this when adding, changing, reviewing, or debugging tools the assistant can call.

Reference tool set:

- `tasks` is the best full reference: registry entries, handler validation, label name resolution, duplicate protection, tier gate, CRUD delegation.
- `labels` is the simplest resolver-adjacent reference.
- `knowledge`, `briefings`, `web-research`, and `drive` are specialized tools; do not force them into CRUD shape.

## Tool Layer Principle

Tools are standalone application actions. They are not owned by chat.

Any surface should be able to call the same executor: chat, widget chat, cron, webhooks, or future agents. Chat is only one consumer.

The tool flow is:

```text
lib/ai/tools/registry/<feature>.registry.ts
  -> declares OpenAI-compatible tool schema + minTier + group

lib/ai/tools/handlers/<feature>.handler.ts
  -> validates parsed args
  -> resolves names to IDs when needed
  -> checks tier/usage gates when needed
  -> delegates to lib/features/<feature>/
  -> returns ActionResult

lib/ai/tools/executor.ts
  -> parses JSON arguments
  -> verifies the tool is active for the user
  -> optionally verifies the tool is in a runtime allow-list (for scoped runs)
  -> dispatches by tool name
```

## Folder Map

```text
lib/ai/tools/
  index.ts
  types.ts
  registry.ts
  executor.ts
  resolvers.ts
  registry/
    tasks.registry.ts
    contacts.registry.ts
    <feature>.registry.ts
  handlers/
    tasks.handler.ts
    contacts.handler.ts
    <feature>.handler.ts
```

`registry.ts` and `executor.ts` are orchestration files. They should only import and spread feature-owned definitions or handlers. Do not put feature business logic in either file.

## Registry Entries

Registry files define what the LLM is allowed to request.

Every entry uses `ToolRegistryEntry`:

```ts
{
  minTier: "free",
  group: "tasks",
  type: "function",
  function: {
    name: "create_task",
    description: "Create a new task for the user...",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title..." }
      },
      required: ["title"]
    }
  }
}
```

Rules:

- Use OpenAI function-calling schema shape.
- Include `minTier` on every tool.
- Include `group` on every tool.
- Use stable snake_case tool names: `create_task`, `list_tasks`, `update_task`, `delete_task`.
- Make descriptions specific. The model decides whether to call a tool from the description.
- Put destructive-use guidance in the description, such as requiring confirmation before `delete_*`.
- Prefer user-friendly arguments where useful, such as `labelNames`, then resolve to IDs in the handler.
- Keep schemas small and action-oriented. Do not expose internal DB fields unless needed.

`getToolsForTier(tier, disabledToolNames)` strips `minTier` and `group` before sending tools to the LLM. `getActiveToolsForUser(userId)` reads the user's tier and disabled-tool preferences.

## Handler Files

Handlers execute the action requested by the LLM.

Handler responsibilities:

- Start with `import "server-only"`.
- Receive `(userId, args)`.
- Treat `args` as untrusted.
- Validate with Zod schemas from `lib/features/<feature>/schemas.ts`.
- Resolve names to IDs before validation when the public tool arg differs from server input.
- Enforce create/action tier gates just like API routes.
- Prevent obvious duplicates when the LLM may create redundant records.
- Delegate to `lib/features/<feature>/` logic.
- Return `ActionResult`.

Handlers should not:

- Import client components.
- Call API routes with `fetch()`.
- Contain Prisma-heavy business logic that belongs in `lib/features/<feature>/`.
- Bypass `userId` ownership.
- Return secrets, provider tokens, raw Prisma rows, or large unnecessary payloads.

## ActionResult

Tool handlers return one shared shape:

```ts
type ActionResult = { ok: true; data: unknown } | { ok: false; error: string };
```

Return compact, useful data:

- Created/updated record for successful mutations.
- Arrays for list/search tools.
- `{ deleted: true }` plus a title/name for successful deletes.
- Clear English error messages for invalid input, missing records, duplicate records, or tier limits.

Errors are tool-facing technical text. The assistant turns them into user-facing language.

## Task Tool Example

`create_task` is a good pattern to mirror:

```text
LLM args
  -> labelNames converted to labelIds via resolveOrCreateLabelIdsByNames()
  -> createTaskSchema.safeParse()
  -> duplicate active-task check
  -> enforceTasksMax(userId)
  -> createTask(userId, parsed.data)
  -> { ok: true, data: task }
```

This shows the correct layering:

- Registry exposes `labelNames` because names are natural for the LLM.
- Handler resolves names to IDs.
- Zod validates the final server input.
- Handler performs LLM-specific duplicate protection.
- Tier gate mirrors the API route.
- `lib/features/tasks/create.logic.ts` performs the database write.

## Resolvers

Use `lib/ai/tools/resolvers.ts` for shared name-to-ID helpers.

Current examples:

- `resolveLabelIdByName(userId, name)` finds an existing label.
- `resolveOrCreateLabelIdsByNames(userId, names)` finds or creates labels and returns deduplicated IDs.

Add resolvers when multiple handlers need the same name-to-ID behavior. Keep resolver output user-scoped.

## Executor

`executeToolCall(userId, toolCall, options?)` is the only dispatcher.

It does four things:

1. Parses `toolCall.function.arguments` as JSON.
2. Finds the handler by tool name.
3. Calls `getActiveToolsForUser(userId)` and rejects tools disabled by tier or user settings.
4. Calls the handler.

Optional runtime scope:

- `options.allowedToolNames` can be passed by an orchestrator (for example, main chat with an active skill).
- When provided, a tool must pass both checks:
  - active for tier/settings
  - included in `allowedToolNames`
- This keeps executor-level defense in depth when the LLM emits out-of-scope tool calls.

When adding a tool group, the only executor changes should be:

- Import the feature handler map.
- Spread it into `HANDLERS`.

No feature-specific branches belong in `executor.ts`.

## Active Tools And Settings

Active tools are filtered by:

- User tier.
- User disabled-tool preferences.

The settings API validates disabled tool names against `TOOL_REGISTRY`, so tools must be registered centrally before they can appear in settings.

When a tool is unavailable, the LLM should not see it in the provider `tools` list, and the executor still rejects it as a defense-in-depth check.

## Chat Tool Loop

Main chat and widget chat both follow the same broad flow:

```text
getActiveToolsForUser(userId)
compute effective runtime tools for the surface
buildSystemPrompt(userId, message, { tools: effectiveTools })
streamChat(messages, { tools: effectiveTools })
collect tool calls
enforceToolCallsMonthly(userId, count)
executeToolCall(userId, eachToolCall, { allowedToolNames: effectiveToolNames? })
append tool results to conversation
repeat for a small number of rounds
final pass without tools for text response
```

When main chat has an active skill, `effectiveTools` should be the strict intersection of:

- tier-allowed tools
- user-enabled tools
- skill-allowed tools

If a surface has no additional runtime scope (for example, standard widget runs), the optional `allowedToolNames` argument can be omitted.

The current chat streams allow up to six tool rounds before a final text-only pass. This lets the model use IDs returned by one tool call in later tool calls.

Tool execution emits action events to the client and may create compact report details. Keep tool result data useful but not bloated.

## Meeting Recap Intake

Meeting recaps are a multi-tool workflow, not a monolithic importer. The
assistant should inspect existing context, call list/recall tools when it needs
exact IDs, reuse matching records, create missing records with their native
tools, and then link the returned IDs across the related records.

When the user says something like "I met with Alice and Bob today about Project Nexus", the assistant should:

1. Inspect existing context and call list/recall tools when it needs exact IDs or confirmation that records do not exist.
2. Reuse matching records instead of creating duplicates.
3. Create missing contacts first so returned contact IDs can be used as meeting participants.
4. Create missing labels explicitly when the prompt asks for labels.
5. Store durable recap context with `remember_fact` when the meeting, project, decision, or follow-up date matters beyond the structured records.
6. Create the meeting record for the meeting that happened with `status: "done"`.
7. Create a separate future follow-up meeting with `status: "upcoming"` when a follow-up is scheduled.
8. Create and link the decision to the recap meeting, not the follow-up meeting.
9. Create and link the goal.
10. Create one preparation task linked to the follow-up meeting and related goal unless the user explicitly says not to.
11. Use update tools as needed when a returned ID is only available after an earlier tool call.

This workflow can need several dependent tool rounds, so chat surfaces should allow enough rounds for read -> create -> link behavior before the final text-only response.

## Tool Design Rules

- Tools should map to real product actions, not arbitrary prompts.
- Prefer one clear action per tool.
- CRUD features usually expose create, list, update, and delete tools, plus small domain helpers when useful, such as `complete_task`.
- Read/list tools should help the model find IDs before update/delete tools.
- Delete tools must require IDs and should say confirmation is required.
- Create tools should avoid duplicates where the LLM is likely to repeat itself.
- Tools that write data must enforce the same user scope and tier rules as API routes.
- Expensive tools must have rate, tier, or quota enforcement.
- Tool names, args, and descriptions should remain stable unless you update handlers, prompts, settings, and docs together.

## Adding A New Feature Tool Set

For a normal CRUD feature:

1. Add `lib/ai/tools/registry/<feature>.registry.ts`.
2. Add registry entries with `minTier`, `group`, `name`, `description`, and `parameters`.
3. Import and spread the feature tools in `lib/ai/tools/registry.ts`.
4. Add `lib/ai/tools/handlers/<feature>.handler.ts`.
5. Validate args with feature Zod schemas.
6. Add resolvers if the LLM uses names but server logic needs IDs.
7. Enforce tier gates for create/action tools.
8. Delegate to `lib/features/<feature>/` logic.
9. Export a handler map keyed by exact tool names.
10. Import and spread the handler map in `lib/ai/tools/executor.ts`.
11. Verify chat and widget chat still receive filtered active tools.
12. Update user-facing tool settings/i18n if the tool appears in settings UI.

## Tool Checklist

Before finishing tool work, verify:

- Registry entry exists and has `minTier` + `group`.
- Tool description tells the LLM when to use it.
- Handler name exactly matches registry function name.
- Handler validates untrusted args.
- Handler is user-scoped.
- Create/action handler enforces the matching tier gate.
- Handler delegates to `lib/features/<feature>/`.
- Executor only imports and spreads the handler map.
- Active-tool filtering still works for tier and disabled tools.
- Tool result is compact and does not leak secrets or raw internal data.
- Destructive tools require clear user intent or confirmation before use.
