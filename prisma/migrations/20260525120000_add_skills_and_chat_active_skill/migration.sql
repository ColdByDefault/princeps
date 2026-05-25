-- CreateTable
CREATE TABLE "skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructionsMarkdown" TEXT NOT NULL,
    "allowedTools" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "chat" ADD COLUMN "activeSkillId" TEXT;

-- CreateIndex
CREATE INDEX "skill_userId_idx" ON "skill"("userId");

-- CreateIndex
CREATE INDEX "skill_userId_updatedAt_idx" ON "skill"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "chat_activeSkillId_idx" ON "chat"("activeSkillId");

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_activeSkillId_fkey" FOREIGN KEY ("activeSkillId") REFERENCES "skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
