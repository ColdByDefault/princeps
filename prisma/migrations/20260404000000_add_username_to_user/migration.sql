-- AddColumn username to user with unique constraint
ALTER TABLE "user" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
