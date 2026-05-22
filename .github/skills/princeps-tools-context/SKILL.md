---
name: princeps-tools-context
description: Princeps LLM tools and context-slot workflow. Use when adding, updating, reviewing, or debugging assistant-callable tools, tool registries, tool handlers, executor wiring, active tool filtering, tool settings, context slots, LLM awareness, or feature data exposed to chat.
---

# Princeps Tools And Context

Use this skill when the assistant should act on or reason over Princeps feature data.

## Required Reads

Read only what applies:

- `CONTEXT/06_LLM_TOOLS.md` for the current tool architecture.
- `CONTEXT/11_NEW_FEAT_Impl.md` for how tools and context fit into full features.
- `CONTEXT/05_LLM_PROVIDERS.md` when provider calls are involved.
- `.github/instructions/features/feature.instructions.md` for full-stack wiring.
- `.github/instructions/backend/server-data.instructions.md` for server-only and user-scope rules.

Verify live code in `lib/ai/tools/`, `lib/ai/context/`, and the owning `lib/features/<feature>/` before editing.

## Tool Workflow

1. Decide whether a tool is appropriate:
   - Add tools only for real product actions, not arbitrary prompts.
   - CRUD features usually expose create, list, update, and delete tools.
   - Expensive or destructive actions need clear intent, tier/usage gates, and safe descriptions.

2. Add registry entries:
   - Create or edit `lib/ai/tools/registry/<feature>.registry.ts`.
   - Include `minTier`, `group`, OpenAI function schema, stable snake_case names, descriptions, and compact parameters.
   - Use friendly arguments when useful, such as `labelNames`, and resolve them in handlers.
   - Import and spread the entries in `lib/ai/tools/registry.ts`.

3. Add handlers:
   - Create or edit `lib/ai/tools/handlers/<feature>.handler.ts`.
   - Start with `import "server-only"` when server dependencies are imported.
   - Treat args as untrusted.
   - Resolve names to IDs before server validation when needed.
   - Validate with feature Zod schemas.
   - Prevent obvious duplicates where LLM repetition is likely.
   - Enforce the same feature-specific gates as API routes.
   - Delegate to `lib/features/<feature>/`.
   - Return compact `ActionResult` data.
   - Import and spread the handler map in `lib/ai/tools/executor.ts`.

4. Keep orchestration clean:
   - Do not put feature logic in `registry.ts` or `executor.ts`.
   - Do not call API routes from handlers.
   - Do not return secrets, provider tokens, raw Prisma rows, or bloated payloads.

## Context Slot Workflow

Add `lib/ai/context/<feature>.slot.ts` when the assistant should know user-scoped feature data in conversations.

- Fetch compact, bounded, user-owned data.
- Include stable record IDs when tools may need them later.
- Return `null` when empty.
- Use the incoming `query` only for relevance or semantic search.
- Register the slot in `SLOT_REGISTRY`.

## Verification

- Registry function names match handler map keys.
- Active tool filtering still works for tier and disabled-tool preferences.
- Tool handlers enforce ownership and feature quotas.
- Context output is compact and does not leak private provider data.
- Chat and widget chat still receive filtered active tools.
