-- Refactor knowledge_document: replace the earlier richer schema
-- (title, sourceType, priority, tags, updatedAt) with the simpler shape
-- (name, charCount) used by the file-upload-only design.
-- Also add lifetime tracking counters to the user table.

-- ─── knowledge_document ───────────────────────────────────

-- Rename title → name (preserves data for display purposes)
ALTER TABLE "knowledge_document" RENAME COLUMN "title" TO "name";

-- Drop columns that were removed from the model
ALTER TABLE "knowledge_document" DROP COLUMN IF EXISTS "sourceType";
ALTER TABLE "knowledge_document" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "knowledge_document" DROP COLUMN IF EXISTS "tags";
ALTER TABLE "knowledge_document" DROP COLUMN IF EXISTS "updatedAt";

-- Ensure charCount exists (it should, but guard against partial past migrations)
ALTER TABLE "knowledge_document" ADD COLUMN IF NOT EXISTS "charCount" INTEGER NOT NULL DEFAULT 0;

-- ─── user ────────────────────────────────────────────────

-- Lifetime knowledge tracking counters (never decremented — the bypass-prevention gate)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "knowledgeCharsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "knowledgeUploadsUsed" INTEGER NOT NULL DEFAULT 0;
