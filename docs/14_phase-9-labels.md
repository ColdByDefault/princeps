<!--
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
-->

# Phase 9 — Labels

## Plan

### Goal

Introduce user-owned labels that work as reusable badges across the workspace. A label is a lightweight classification primitive such as `private`, `Company X`, or `Project Y` that the user defines once and then reuses across features.

### Scope

#### Pass 1 — standalone labels

- Add a dedicated `Label` Prisma model owned by `User`
- Add CRUD logic for labels
- Add labels management UI inside App Settings

#### Pass 2 — feature wiring

- Wire labels into contacts, meetings, tasks, decisions, and knowledge documents via join tables
- Add a shared `LabelPicker` component for form-level selection
- Expose labels to the assistant context and chat creation tools
- Replace the legacy freeform `tags` column on contacts with structured labels

#### Pass 3 — audit cleanup

- Fix stale i18n copy, hardcoded UI strings, and accessibility gaps
- Extract duplicated row-mapping helpers into `shared.logic.ts` per feature
- Extract duplicated `labelNames` filtering into a helper in `tools.ts`
- Remove dead `tags` plumbing from contacts (schema, types, logic, API routes)
- Drop the `tags` column from the Prisma `Contact` model

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
- Fixed stale `labels.deleteConfirmBody` i18n copy that still referenced a future pass (en + de)
- Replaced hardcoded count strings in `TaskList`, `DecisionList`, and `ContactList` with i18n keys
- Added `aria-label` attributes to `TaskList` edit/delete icon buttons for screen readers
- Unified the count placeholder convention to `{count}` across `MeetingList` and i18n files
- Extracted `toMeetingRecord`, `toTaskRecord`, and `toDecisionRecord` into `shared.logic.ts` files to remove duplicated row-mapping across create/update/list logic
- Extracted `toLabelNames()` helper in `lib/chat/tools.ts` to replace four identical inline filter blocks
- Removed dead `tags` field from `ContactRecord`, `ContactCreateSchema`, `ContactUpdateSchema`, create/update/list logic, and API routes
- Dropped the `Contact.tags` column from the Prisma schema and added migration `20260401180000_drop_contact_tags`
- Regenerated the Prisma client after dropping the tags column
- Revalidated the audit-cleanup pass with `npm run lint`, `npm run typecheck`, and `npm run build`

## Later

- Evaluate optional metadata later if needed, such as color, ordering, or archival state

