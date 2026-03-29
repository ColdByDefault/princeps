-- EnableExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "knowledge_document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(4096),
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_document_userId_idx" ON "knowledge_document"("userId");

-- CreateIndex
CREATE INDEX "knowledge_chunk_userId_idx" ON "knowledge_chunk"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_info_userId_key" ON "personal_info"("userId");

-- AddForeignKey
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_info" ADD CONSTRAINT "personal_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cosine search via sequential scan (`<=>`) is used instead, which is
-- sufficient at free-tier scale (5 documents, ~500 chunks max).
