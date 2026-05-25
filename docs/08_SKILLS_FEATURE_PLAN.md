# Skills Feature Plan

Last updated: 2026-05-25

## Purpose

Define the delivery plan for Skills with two clear product surfaces:

- A dedicated page for creating and managing skills.
- Lightweight skill selection controls inside main chat.

This plan keeps current assistant settings behavior unchanged and keeps chat-widget isolated from Skills.

## Decision Update

The project will not use chat settings as the place to author full skills.

Updated direction:

- Use a dedicated `/skills` page for create, edit, delete, and library management, add it to intelligence dropdown.
- Use `/chat` only to select one active skill per chat thread and quickly enable or disable it for that thread.
- Keep chat-widget behavior unchanged (no Skills injection in widget prompt/runtime).

## Product Scope

### Included

- User-created reusable skills.
- Skill fields: name, description, markdown instructions, allowed tools.
- Tier-gated saved skill library per user.
- Chat-scoped activation with one active skill maximum per chat.
- Markdown authoring support on `/skills`.

### Excluded For This Pass

- Temperature and timeout migration to DB (keep current local behavior).
- Applying skills to chat-widget.
- Multi-skill composition inside a single chat turn.

## UX Surfaces

## 1) Dedicated `/skills` Page

Primary workspace for skill authoring and management.

Core capabilities:

- View saved skills with status and last update time.
- Create a new skill.
- Edit existing skill.
- Delete skill.
- Duplicate skill (optional nice-to-have).
- Assign allowed tools from the currently known tool catalog.
- Markdown editor for skill instructions with live preview toggle.
- Usage indicator for tier limit (for example: 2/3 used on free).

Skill form fields:

- Name (required, short).
- Description (required, plain text).
- Instructions (required, markdown supported).
- Allowed tools (required set, at least one recommended).

Authoring notes:

- Markdown is stored as source text.
- Preview rendering is for author UX only; runtime uses plain instruction text.

## 2) Main Chat (`/chat`)

Main chat should provide quick thread-level controls only:

- Skill picker for the current chat: `None` + user skill library.
- Enable skill for this chat.
- Disable active skill for this chat.
- Replace active skill with a different one (still max one active).

Behavior rules:

- Different chats can use different active skills at the same time.
- One chat can never run more than one active skill.
- If active skill is deleted, that chat falls back to `None` safely.

## 3) Chat Widget

No skill injection for widget in this feature.

- Widget keeps existing prompt construction.
- Widget keeps existing tool availability behavior.
- Existing assistant naming/settings behavior remains unchanged.

## Data Model Direction

Use a user-owned feature entity, not `User.preferences`.

Suggested shape:

- `Skill`
  - `id`, `userId`
  - `name`, `description`
  - `instructionsMarkdown`
  - `allowedTools` (string array/json)
  - `createdAt`, `updatedAt`

- `Chat`
  - `activeSkillId` (nullable, user-owned relation safety enforced)

This preserves per-chat activation while keeping one reusable skill library per user.

## Prompt And Tool Resolution

When a main chat has an active skill:

1. Build normal base system prompt exactly as today.
2. Append a bounded skill section (secondary layer) using the skill markdown instructions.
3. Compute runtime tools with strict intersection:

`effectiveTools = tierAllowedTools INTERSECT userEnabledTools INTERSECT skillAllowedTools`

Enforcement guarantees:

- Skills never bypass tier restrictions.
- Skills never bypass disabled tools from Tools settings.
- Tool executor still enforces final availability as defense in depth.

## Tier Contract

Saved skill library cap per user:

- free: 3
- pro: 10
- premium: 25
- enterprise: 50

Activation cap per chat:

- all tiers: max 1 active skill per chat

## API Direction

Skills library APIs:

- `GET /api/skills`
- `POST /api/skills`
- `PATCH /api/skills/[id]`
- `DELETE /api/skills/[id]`

Chat skill activation API (thread scoped):

- `PATCH /api/chat/[chatId]` with `activeSkillId` updates (or dedicated sub-route if preferred).

Validation expectations:

- Skill ownership by `userId`.
- Chat ownership by `userId`.
- Skill and chat must belong to same user on activation.
- Allowed tools validated against known tool names.

## i18n Requirements

All user-facing text must be in both locales:

- `messages/en.json`
- `messages/de.json`

Required areas:

- `/skills` page labels, placeholders, notices, dialogs.
- Chat skill picker and action labels.
- Tier-limit and validation feedback.

## Implementation Phases

1. Data + tier limits.
2. Skills backend CRUD.
3. `/skills` page with markdown authoring.
4. Main chat skill picker and thread activation controls.
5. Main chat runtime prompt/tool intersection wiring.
6. i18n, usage display, validation.

## Acceptance Checks

- Free user can save up to 3 skills, then receives tier-limit response.
- Pro user can save up to 10, Premium 25, Enterprise 50.
- Two chats can run two different skills simultaneously.
- A single chat cannot run two skills at once.
- Disabling a tool in Tools settings prevents that tool inside skill runtime.
- Widget responses are unchanged by skill activation in main chat.
- Markdown authoring works on `/skills` and persists correctly.
