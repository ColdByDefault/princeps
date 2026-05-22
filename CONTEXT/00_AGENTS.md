# 12 - Agent Structure

Last updated: 2026-05-07

This is the second entrypoint after `AGENTS.md` for any agent working in Princeps: Codex, GitHub Copilot, Claude, or a future project agent.

Use it to decide:

- What to read first.
- When to use `CONTEXT/`.
- When to use `docs/`.
- When to use `.github/`.
- Which `.github/agents/*` agent fits the task.
- How to handle conflicts between guidance files and live code.

## Authority Order

Use this order when sources disagree:

1. Latest user request.
2. Active system/developer/tool instructions for the current agent.
3. `AGENTS.md` for repo-wide rules.
4. Live code for current implementation details.
5. `CONTEXT/` for compact agent maps of the live architecture.
6. `docs/` for product decisions and developer manuals.
7. `.github/` for GitHub/Copilot agent behavior and detailed rule packs.

Important: some `.github` instruction files still mention `lib/llm/`. The live implementation uses `lib/ai/llm-providers/`. Prefer live code and `CONTEXT/05_LLM_PROVIDERS.md` for provider paths.

## First Reads

For any non-trivial task:

```text
1. AGENTS.md
2. CONTEXT/01_GLOBAL_SCOPE.md
3. CONTEXT/02_GLOBAL_STRUC.md
4. The specific CONTEXT file for the layer/feature being touched
5. Relevant live code
6. Relevant docs/ manual if product behavior or historical decision matters
7. Relevant .github/instructions file if using GitHub Copilot agents
```

Do not implement from docs or context alone. Always verify against the current code.

## How To Use CONTEXT/

`CONTEXT/` is for agents. It is a fast, curated map of how the current repo works.

Use it when:

- Starting work in an unfamiliar area.
- Choosing the right layer to edit.
- Avoiding repeated rediscovery of architecture.
- Building or reviewing a feature.
- Understanding cross-cutting systems like tools, tiers, settings, providers, or notifications.

Current map:

```text
01_GLOBAL_SCOPE.md          Product identity and scope
02_GLOBAL_STRUC.md          Repo/layer structure
03_BACKEND_STRUC.md         Backend, API, Prisma, lib patterns
04_FRONTEND_&_i18n_STRUC.md Frontend and localization patterns
05_LLM_PROVIDERS.md         Provider abstraction, streaming, embeddings
06_LLM_TOOLS.md             Tool registry, handlers, executor
07_TIER_SYS.md              Plans, quotas, gates, usage counters
08_USERS_REF.md             User model, preferences, settings storage
09_APP_SETTINGS.md          /settings tabs and save flows
10_NOTIFICATION_STRUC.md    Notifications, greetings, nudges, weather
11_NEW_FEAT_Impl.md         How to build a full new feature
12_AGENTS_STRUC.md          This file
13_INTEGRATIONS.md          Integration reference, when filled
```

Use `CONTEXT/11_NEW_FEAT_Impl.md` before building any new tool or full-stack feature.

Update `CONTEXT/` when:

- A pattern changes.
- A layer gains a new important rule.
- An agent would otherwise have to rediscover a repeated architecture detail.
- You add a significant feature/system and future agents need a compact map.

Keep `CONTEXT/` concise and current. It is not a product spec and not a changelog.

## How To Use docs/

`docs/` is for developer manuals, product decisions, and implementation notes with more narrative context.

Use it when:

- You need the reason behind a product or architecture decision.
- A feature has a detailed manual or design note.
- You are changing behavior that should be documented for humans.
- You need historical context before refactoring.

Current wiki files:

```text
docs/00_WIKI_INDEX.md          Human docs entrypoint
docs/01_USER_GUIDE.md          How to use Princeps
docs/02_ARCHITECTURE.md        Human architecture overview
docs/03_FEATURES_REFERENCE.md  Feature map and owning files
docs/04_DEVELOPER_PLAYBOOK.md  Setup, extension, operations, and production notes
```

Update `docs/` when:

- Product behavior changes.
- A developer manual becomes outdated.
- A setup procedure changes.
- A significant feature, integration, or billing rule changes.

Do not use `docs/` as a substitute for code inspection. Docs explain intent; code shows the current implementation.

## How To Use .github/

`.github/` is mostly for GitHub Copilot, GitHub agents, repository automation, and detailed instruction packs.

Important folders:

```text
.github/agents/          Agent personas and task modes
.github/instructions/    Detailed Copilot instruction files
.github/skills/          Optional local skills, e.g. shadcn guidance
.github/workflows/       GitHub Actions
.github/ISSUE_TEMPLATE/  Issue templates
```

Use `.github/instructions/` when working through Copilot or when a task matches the instruction scope:

```text
main.instructions.md          High-level repo overview
feature.instructions.md       Full feature implementation rules
frontend-i18n.instructions.md Frontend, hydration, UI, i18n
server-data.instructions.md   API, lib, Prisma, auth, tools, boundaries
```

Use `.github/skills/` only when the skill directly applies. Current example:

```text
.github/skills/shadcn/skill.md
```

Do not treat `.github/` as always fresher than code. Some paths are older than the live implementation.

## Choosing An Agent

The current GitHub agent roster:

```text
.github/agents/explore.agent.md
.github/agents/feature.agent.md
.github/agents/reviewer.agent.md
```

### Explore

Use `Explore` for read-only research.

Choose it when the task is:

- "How does X work?"
- "Where is Y implemented?"
- "Trace this data flow."
- "Compare Tasks and Meetings."
- "Find every use of this pattern."
- "Explain what is real vs what docs say."

Explore should not edit files.

### Feature

Use `Feature` for implementation.

Choose it when the task is:

- Add a feature.
- Fix a bug.
- Refactor code.
- Add API/lib/component/tool/context wiring.
- Update i18n strings.
- Run validation commands.
- Prepare a PR-ready change.

Feature should read the relevant `CONTEXT/` files first, then inspect the code it will modify.

### Reviewer

Use `Reviewer` for read-only review.

Choose it when the task is:

- "Review this PR/change."
- "Check architecture compliance."
- "Find hydration risks."
- "Check i18n completeness."
- "Check server/client boundary violations."
- "Audit against AGENTS and .github instructions."

Reviewer reports findings only. It should not suggest broad rewrites unless directly tied to a violation, and it should not edit files.

## Agent Selection Flow

```text
Need answer/explanation only?
  -> Explore

Need code/doc changes?
  -> Feature

Need review/audit?
  -> Reviewer

Unclear implementation area?
  -> Explore first, then Feature

Large or risky implementation?
  -> Feature, then Reviewer
```

Codex usually acts like `Feature` when the user asks for changes, and like `Explore` when the user asks for explanation. For explicit "review" requests, use the `Reviewer` stance.

## Task Workflow For Agents

1. Read `AGENTS.md`.
2. Read this file.
3. Read the relevant `CONTEXT/` files.
4. Read matching `.github/instructions/*` if the task is being performed through GitHub/Copilot or the rule pack is clearly relevant.
5. Read relevant `docs/` if product behavior, billing, integrations, setup, or design decisions are involved.
6. Inspect live code before editing.
7. Make the smallest coherent change.
8. Update `CONTEXT/` or `docs/` when behavior or architecture changes.
9. Run `npm run lint`, `npm run typecheck`, and `npm run build` for full features or risky changes.

## What To Update

Update `AGENTS.md` when:

- A universal rule changes for all agents.
- The repo entrypoint needs to change.
- A rule must apply before any task-specific context is read.

Update `CONTEXT/` when:

- Agents need a fast map of a live system.
- A recurring architecture pattern changes.
- You add a new system that crosses several layers.

Update `docs/` when:

- Human developers need a manual or decision record.
- Product behavior, billing, integration setup, or deployment setup changes.

Update `.github/` when:

- Copilot/GitHub agent behavior should change.
- A rule belongs to a specific agent persona.
- A detailed instruction pack should be applied automatically by path or task type.

## Conflict Examples

If `.github` says `lib/llm/` but code uses `lib/ai/llm-providers/`:

```text
Use lib/ai/llm-providers/.
Mention the stale instruction if editing docs or agent guidance.
```

If docs say a notification stream exists but live code has no stream route:

```text
Use live code.
Check CONTEXT/10_NOTIFICATION_STRUC.md.
Update docs if the task changes notification behavior.
```

If a context file and code disagree:

```text
Trust live code.
Patch the CONTEXT file if the difference matters for future agents.
```

## Do Not

- Do not skip code reading because a context file sounds complete.
- Do not treat `docs/` as generated memory for agents; it is for developer manuals and decisions.
- Do not use `.github/agents/reviewer.agent.md` for implementation work.
- Do not let a client component import server-only code.
- Do not add feature business logic to API routes, tool executor, or provider adapters.
- Do not update many unrelated docs when one focused context/doc update is enough.
