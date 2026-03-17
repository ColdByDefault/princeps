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

### Data Shape

Phase 1 now has a concrete minimal data model:

- `Meeting` as the parent record for prep, summary, and next steps
- `MeetingParticipant` for simple participant details per meeting
- `MeetingActionItem` for follow-up items created from meetings
- `Decision` for meeting-linked decisions and rationale

The model stays intentionally small. It captures structured essentials first and leaves broader task or contact systems for later.

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
- Prisma schema now includes the first Phase 1 user-scoped data entities for meetings, participants, action items, and decisions
- meeting server logic and API routes now exist for create, list, detail, and update flows
- authenticated UI now exists for meeting list, meeting creation, meeting detail, and entry from `/home`
- tested working flow today: creating a meeting and navigating to its detail page
- meeting editing now exists through a dedicated edit page that reuses the same form and PATCH route
- meeting deletion now exists with a confirmation flow from the edit screen
- post-meeting editing now exists for summary, next steps, action items, and decisions


