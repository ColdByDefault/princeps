-- CreateTable
CREATE TABLE "assistant_report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolsCalled" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_report_userId_createdAt_idx" ON "assistant_report"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "assistant_report" ADD CONSTRAINT "assistant_report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
