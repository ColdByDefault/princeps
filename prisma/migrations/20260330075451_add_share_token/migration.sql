-- CreateTable
CREATE TABLE "share_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "share_token_userId_idx" ON "share_token"("userId");

-- AddForeignKey
ALTER TABLE "share_token" ADD CONSTRAINT "share_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
