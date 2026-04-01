<!--
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
-->

# Phase 9 — Labels

## Plan

### Goal

Introduce user-owned labels that work as reusable badges across the workspace. A label is a lightweight classification primitive such as `private`, `Company X`, or `Project Y` that the user defines once and then reuses across features.

### Scope for this pass

This first pass is intentionally narrow:

- Add a dedicated `Label` Prisma model owned by `User`
- Add CRUD logic for labels
- Add labels management UI inside App Settings
- Keep labels standalone for now

This pass does **not** attach labels to contacts, meetings, tasks, decisions, knowledge, or chat records yet.

### Product rules

- Labels are user-scoped
- Labels are reusable and centrally managed from App Settings
- Label names should be trimmed and normalized before persistence
- Duplicate labels for the same user should be blocked even if casing or extra spacing differs
- Labels should be presented as compact badges in the settings UI

### Data model

Initial schema shape:

```prisma
model Label {
  id             String   @id @default(cuid())
  userId         String
  name           String
  normalizedName String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, normalizedName])
  @@index([userId])
  @@map("label")
}
```

### API and logic boundaries

- `lib/labels/` owns list/create/update/delete logic and validation helpers
- `app/api/settings/labels` owns settings-facing label CRUD endpoints
- `app/(app)/settings/app/page.tsx` loads the current user labels server-side and passes them into a dedicated client section

### UX for this pass

- Add a labels card to App Settings
- Users can create a label from a single text input
- Users can rename or delete existing labels inline
- The page should show an empty state when no labels exist yet
- The UI should stay focused on management, not feature linking

## Done

- Defined Phase 9 as a reusable-label system rather than ad hoc per-feature tags
- Locked the first-pass scope to user-owned labels plus App Settings CRUD only
- Added a `Label` Prisma model with `userId`, `name`, `normalizedName`, timestamps, and a unique constraint on `(userId, normalizedName)`
- Added `lib/labels/` CRUD logic plus normalization helpers and Zod request schemas
- Added settings-scoped API routes at `app/api/settings/labels` and `app/api/settings/labels/[id]`
- Added a Labels card to App Settings with create, inline rename, and delete flows
- Added pointer affordances and tooltips for the labels card action controls
- Added English and German message keys for the labels settings surface
- Validated the first pass with `npm run db:generate`, `npm run lint`, `npm run typecheck`, and `npm run build`
- Started the second-pass feature wiring by adding label selection support to the contact form payload and UI
- Wired contacts end to end so labels can be loaded, selected, saved, and rendered in the list view
- Wired meetings end to end so labels can be loaded, selected, saved, and rendered in the list view
- Wired tasks end to end so labels can be loaded, selected, saved, and rendered in the list view
- Wired decisions end to end so labels can be loaded, selected, saved, and rendered in the list view
- Wired knowledge documents end to end so labels can be loaded, assigned, updated, and rendered in the document list
- Replaced the contact UI's leftover freeform tag usage with labels as the structured classification surface
- Exposed labels to assistant context and creation tool flows so the assistant can see available labels and apply existing labels by name
- Regenerated the Prisma client after the relation schema changes so server logic and generated types matched again
- Revalidated the multi-feature labels pass with `npm run lint`, `npm run typecheck`, and `npm run build`

## Later

- Evaluate optional metadata later if needed, such as color, ordering, or archival state

## Branch File List

Branch compared: `feat/improvment-1-2` vs `main`

### Added

- `app/api/settings/labels/[id]/route.ts`
- `app/api/settings/labels/route.ts`
- `components/settings/LabelsSection.tsx`
- `components/shared/LabelPicker.tsx`
- `docs/14_phase-9-labels.md`
- `lib/context/labels.slot.ts`
- `lib/knowledge/update.logic.ts`
- `lib/labels/create.logic.ts`
- `lib/labels/delete.logic.ts`
- `lib/labels/list.logic.ts`
- `lib/labels/normalize.ts`
- `lib/labels/schemas.ts`
- `lib/labels/shared.logic.ts`
- `lib/labels/update.logic.ts`
- `prisma/migrations/20260401120000_add_labels/migration.sql`
- `prisma/migrations/20260401124500_add_label_relations/migration.sql`
- `prisma/migrations/20260401170000_add_knowledge_document_label_relations/migration.sql`

### Modified

- `app/(app)/contacts/ContactsView.tsx`
- `app/(app)/contacts/page.tsx`
- `app/(app)/decisions/page.tsx`
- `app/(app)/knowledge/page.tsx`
- `app/(app)/meetings/page.tsx`
- `app/(app)/settings/app/page.tsx`
- `app/(app)/tasks/page.tsx`
- `app/api/contacts/[id]/route.ts`
- `app/api/contacts/route.ts`
- `app/api/decisions/[id]/route.ts`
- `app/api/decisions/route.ts`
- `app/api/knowledge/documents/[id]/route.ts`
- `app/api/meetings/[id]/route.ts`
- `app/api/meetings/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/tasks/route.ts`
- `components/contacts/ContactForm.tsx`
- `components/contacts/ContactList.tsx`
- `components/decisions/DecisionForm.tsx`
- `components/decisions/DecisionList.tsx`
- `components/decisions/DecisionsView.tsx`
- `components/knowledge/DocumentList.tsx`
- `components/knowledge/KnowledgeTabs.tsx`
- `components/meetings/MeetingForm.tsx`
- `components/meetings/MeetingList.tsx`
- `components/meetings/MeetingsView.tsx`
- `components/settings/AppSettingsForm.tsx`
- `components/settings/index.ts`
- `components/shared/index.ts`
- `components/tasks/TaskForm.tsx`
- `components/tasks/TaskList.tsx`
- `components/tasks/TasksView.tsx`
- `docs/00_tasks.md`
- `lib/chat/tools.ts`
- `lib/contacts/create.logic.ts`
- `lib/contacts/list.logic.ts`
- `lib/contacts/schemas.ts`
- `lib/contacts/update.logic.ts`
- `lib/context/build.ts`
- `lib/context/contacts.slot.ts`
- `lib/context/decisions.slot.ts`
- `lib/context/index.ts`
- `lib/context/meetings.slot.ts`
- `lib/context/tasks.slot.ts`
- `lib/decisions/create.logic.ts`
- `lib/decisions/list.logic.ts`
- `lib/decisions/schemas.ts`
- `lib/decisions/update.logic.ts`
- `lib/knowledge/list.logic.ts`
- `lib/meetings/create.logic.ts`
- `lib/meetings/list.logic.ts`
- `lib/meetings/schemas.ts`
- `lib/meetings/update.logic.ts`
- `lib/tasks/create.logic.ts`
- `lib/tasks/list.logic.ts`
- `lib/tasks/schemas.ts`
- `lib/tasks/update.logic.ts`
- `messages/de.json`
- `messages/en.json`
- `prisma/schema.prisma`
- `types/api.ts`

### Other Branch File Changes

- `docs/15_tier-enforcement.md` renamed to `docs/13_phase-8-tier-enforcement.md`
- `docs/13_presentation-overview.md` deleted
- `docs/14_presentation-overview-de.md` deleted
