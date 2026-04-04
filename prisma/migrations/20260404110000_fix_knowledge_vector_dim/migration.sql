-- Fix the embedding column dimension to match OpenAI text-embedding-3-small / ada-002
-- output (1536 dims). Ollama embeddings are zero-padded to this dimension by the
-- application layer before storage.
--
-- The column is nullable so we can safely drop it, re-add at the correct size,
-- and accept that any previously stored embeddings (wrong dimension) are lost.

ALTER TABLE "knowledge_chunk" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "knowledge_chunk" ADD COLUMN "embedding" vector(1536);
