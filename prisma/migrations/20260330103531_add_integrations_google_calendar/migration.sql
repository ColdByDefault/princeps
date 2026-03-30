/*
  Warnings:

  - A unique constraint covering the columns `[googleEventId]` on the table `meeting` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "googleEventId" TEXT;

-- CreateTable
CREATE TABLE "integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_userId_provider_key" ON "integration"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_googleEventId_key" ON "meeting"("googleEventId");

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
