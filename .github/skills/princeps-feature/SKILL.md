---
name: princeps-feature
description: Full-stack Princeps feature implementation workflow. Use when adding a new feature, extending an existing feature across multiple layers, or coordinating Prisma, types, server logic, API routes, UI, i18n, LLM tools, context slots, tiers, settings, notifications, docs, and validation.
---

# Princeps Feature

Use this skill to keep full-stack Princeps feature work coherent without re-discovering every layer.

## Required Reads

Read only what applies to the task:

- `CONTEXT/11_NEW_FEAT_Impl.md` for the full feature map.
- `CONTEXT/03_BACKEND_STRUC.md` for API/server logic.
- `CONTEXT/04_FRONTEND_&_i18n_STRUC.md` for UI and localization.
- `CONTEXT/06_LLM_TOOLS.md` when adding assistant tools.
- `CONTEXT/07_TIER_SYS.md` when adding quotas or paid actions.
- `.github/instructions/features/feature.instructions.md` for the current checklist.
- `.github/instructions/backend/server-data.instructions.md`, `.github/instructions/frontend/frontend.instructions.md`, and `.github/instructions/i18n/i18n.instructions.md` for scoped rules.

Always verify the live code before editing. Prefer `tasks` for complete CRUD, `contacts` for relationship records and duplicates, and `meetings` for linked records, integrations, AI prep packs, and tier/token usage.

## Workflow

1. Define the feature shape:
   - Who owns the data?
   - Which existing feature is the closest reference?
   - Which layers are needed: DB, types, lib, API, UI, i18n, tools, context, tiers, settings, notifications, integrations, docs, or `CONTEXT/`?

2. Build in layer order:
   - Prisma model and migrations when storage changes.
   - Client-safe type in `types/api.ts`.
   - `lib/<feature>/` schemas, shared mapper, and operation files.
   - Thin API routes.
   - Server page and client components.
   - i18n strings and navigation.
   - Tools/context/tier/settings/notifications only when the feature needs them.

3. Keep boundaries intact:
   - All user-owned queries filter by `userId`.
   - Client imports never reach `@/lib/db`.
   - Business logic stays out of routes, pages, and JSX.
   - Server-only modules use `import "server-only"` when they import server dependencies.

4. Finish with verification:
   - Update docs or `CONTEXT/` for significant behavior or architecture changes.
   - Run `npm run lint`, `npm run typecheck`, and `npm run build` after a full feature or risky change.

## Done Criteria

- Every required layer is implemented and wired.
- User-facing copy exists in German and English.
- Tools and API paths enforce equivalent gates.
- The assistant has a context slot if it should know the data.
- Validation commands were run or skipped with a clear reason.
