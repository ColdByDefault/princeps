## Plan

- Establish the base app shell and local database bootstrap incrementally.

## Done

- Started the Docker Postgres + pgvector service and synced the Prisma schema with `prisma db push`.
- Fixed the root layout so it imports its dependencies and renders page children inside the app shell.
- Confirmed `db/init.sql` is currently used only to enable extensions; Prisma owns table creation.
- Added the shadcn input component, replaced the missing theme segmented control with standard buttons, and corrected i18n message imports to the existing JSON files.

## Later

- Fix the remaining typecheck errors in auth UI, SEO helpers, and i18n imports before doing a full Better Auth browser flow test.
