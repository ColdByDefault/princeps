-- CreateTable
CREATE TABLE "contact_note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "note" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_note_userId_idx" ON "contact_note"("userId");

-- CreateIndex
CREATE INDEX "contact_note_contactId_idx" ON "contact_note"("contactId");

-- AddForeignKey
ALTER TABLE "contact_note" ADD CONSTRAINT "contact_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_note" ADD CONSTRAINT "contact_note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
