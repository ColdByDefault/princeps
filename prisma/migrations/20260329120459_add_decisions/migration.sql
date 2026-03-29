-- CreateTable
CREATE TABLE "decision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT,
    "outcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "decidedAt" TIMESTAMP(3),
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decision_userId_idx" ON "decision"("userId");

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
