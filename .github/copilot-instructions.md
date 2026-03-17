<!-- 
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 -->
 
 # See-Sweet Workspace Instructions

## Product Direction

- Treat See-Sweet as a private executive secretariat or chief-of-staff product, similar to the support structure used by major CEOs, but adapted for an individual user.
- The assistant should help the user stay organized across tasks, meetings, contacts, decisions, retrieval context, and system behavior, not behave like a generic prompt box.
- Preserve the product's current shape: authenticated workspace, user-scoped data, retrieval-backed chat, configurable assistant behavior, and multilingual UI.
- Removed features stay removed. Do not reintroduce LiveAvatar, ElevenLabs TTS, `/api/greeting`, or greeting controls in system config.

## Workflow Rules

- Work on one task at a time.
- After finishing a distinct task or step, stop and wait for user approval before starting the next one unless the user explicitly asked for a full multi-step pass in one go.
- Create or edit files one by one. Do not generate many new files in a single burst.
- Ask clarifying questions whenever scope, acceptance criteria, UX behavior, data behavior, or rollout expectations are unclear. Ask multiple concise questions when needed.
- For each new task or feature, add or update a brief note in the most relevant existing project note or doc. Use these sections unless there is a better established format:

```md
## Plan

## Done

## Later
```

- Run `npm run lint`, `npm run typecheck`, and `npm run build` when a task or feature is complete, or when the change is risky or critical. Do not run the full trio after every small edit.

## Baseline Engineering Rules

- Prefer small, incremental edits that preserve the existing architecture.
- Keep business logic in `lib/<feature>/` instead of page components or route handlers.
- Keep Prisma and other server-only dependencies out of client bundles.
- Do not hardcode user-facing copy when localized messages are expected.
- /docs should be the source of truth for product decisions, scope, and implementation notes. Update them as needed when making changes.
