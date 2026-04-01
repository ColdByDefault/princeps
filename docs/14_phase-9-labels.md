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
- Added English and German message keys for the labels settings surface
- Validated the first pass with `npm run db:generate`, `npm run lint`, `npm run typecheck`, and `npm run build`

## Later

- Add label relations to contacts, meetings, tasks, decisions, and knowledge records
- Replace per-feature freeform tag arrays where appropriate
- Add label picker inputs to feature forms and edit dialogs
- Expose labels to assistant tool flows so the assistant can apply structured labels instead of inventing raw strings
- Evaluate optional metadata later if needed, such as color, ordering, or archival state
