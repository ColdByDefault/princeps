# Skills System

Last updated: 2026-05-25

## Purpose

Skills let a user define reusable instruction profiles for the assistant and apply one of them to a specific chat thread.

The system is designed to keep behavior focused and repeatable without changing global assistant settings.

## What A Skill Contains

Each skill stores:

- Name
- Description
- Instructions in markdown
- Allowed tool names
- Timestamps for creation and last update

Skills are user-owned records. A user can only read and modify their own skills.

## Product Surfaces

### Skills Library

The Skills page is the authoring and management surface.

Core behavior:

- List saved skills
- Create skill
- Edit skill
- Delete skill
- Choose allowed tools per skill
- Write instructions in markdown with preview
- Show plan usage against skill-library limit

### Chat Thread Controls

Main chat includes thread-level skill selection.

Core behavior:

- Select no skill or one saved skill for the current chat
- Replace the active skill with another
- Disable skill for the current chat

One chat can have at most one active skill at a time.
Different chats can have different active skills simultaneously.

### Chat Widget

Widget behavior is intentionally unchanged.

- No skill injection in widget prompt assembly
- No skill-specific runtime tool filtering for widget

## Runtime Model In Main Chat

When a chat has an active skill, runtime behavior applies in two layers.

### Prompt Layering

The standard system prompt is built first.
Then a secondary skill section is appended containing:

- Skill name
- Skill description
- Skill-scoped tool list
- Skill instructions text

Skill instructions are bounded in length for runtime safety.

### Tool Availability

Effective runtime tools are the strict intersection of:

- Tier-allowed tools
- User-enabled tools
- Skill-allowed tools

This means a skill can only narrow tool access, never expand it.

## Enforcement Model

Enforcement happens at multiple levels:

- Tool list passed to the model is already skill-scoped
- Sub-agent pre-pass is constrained by the same runtime allow-list
- Final tool execution validates runtime scope in addition to tier and settings checks

This provides defense in depth if a model attempts to call out-of-scope tools.

## Tier Limits

Skill library limits per user:

- Free: 3
- Pro: 10
- Premium: 25
- Enterprise: 50

Activation limit per chat:

- One active skill maximum

## Ownership And Validation Rules

- Skill read and write operations are user-scoped
- Chat updates are user-scoped
- A chat can only activate a skill owned by the same user
- Allowed tool names are validated against the registered tool catalog

## API Surface

Skills library endpoints:

- GET /api/skills
- POST /api/skills
- PATCH /api/skills/[id]
- DELETE /api/skills/[id]

Chat thread skill activation is handled through chat update:

- PATCH /api/chat/[chatId] with activeSkillId updates

## Localization

User-facing Skills UI and chat skill-control text are localized in English and German, including:

- Labels
- Placeholders
- Dialog text
- Success and error feedback

## Expected Behavior

- A user can maintain a reusable skill library within their plan limit
- Selecting a skill in one chat does not affect other chats
- Removing or switching skills updates only the current chat
- Disabled tools and tier restrictions remain enforced under skills
- Widget responses remain unaffected by skill activation in main chat
