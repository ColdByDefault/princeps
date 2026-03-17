# See-Sweet Phase 1 Scope

## Plan

Phase 1 should prove one sharp executive workflow inside the authenticated workspace instead of expanding the shell too early. The goal is to ship one core feature that demonstrates preparation, continuity, and follow-through in a user-scoped product.

### Main Core Feature

Meeting prep and follow-up workspace.

This should be the first complete workflow because it matches the product position best and forces the right product behaviors:

- prepare before a meeting
- capture context during the meeting
- save outcomes after the meeting
- carry actions and decisions forward

### Small Extra Feature

Decision log tied to meetings.

This is a small but high-signal addition because it creates durable executive memory without requiring a broad task platform in Phase 1.

### MVP User Flow

1. The user creates a meeting entry from the authenticated workspace.
2. The user fills in title, date, objective, participants, and optional notes.
3. The system shows a prep view with key context and a structured brief.
4. After the meeting, the user records summary notes, action items, and decisions.
5. The saved meeting becomes a reusable record for future retrieval and follow-up.

### MVP Screens

1. Meeting list page.
2. Create or edit meeting form.
3. Meeting detail page with prep brief and post-meeting capture.
4. Small decision log view, either embedded in the meeting detail page or available as a simple filtered list.

### Data Shape To Add

Phase 1 likely needs new user-scoped models for:

- meetings
- meeting participants or participant text fields
- action items
- decisions

The data model should stay simple. It is better to store structured essentials first than to over-design a full operations system.

### Explicitly Out Of Scope

- full task management platform
- calendar sync
- email integration
- team collaboration
- advanced navigation chrome such as a full sidebar and footer system
- privacy policy and terms pages before a public release requirement exists

## Done

This scope defines the recommended Phase 1 product slice:

- one main feature: meeting prep and follow-up
- one small companion feature: decision log
- minimal shell needs only enough navigation to reach the workflow

## Later

- Add task orchestration once action items from meetings are working well.
- Add contact intelligence after participant context becomes useful often enough.
- Add daily briefings only after the system has enough stored signals to make them meaningful.
