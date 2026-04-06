-- AddIndex
CREATE INDEX IF NOT EXISTS "meeting_userId_scheduledAt_idx" ON "meeting"("userId", "scheduledAt");
